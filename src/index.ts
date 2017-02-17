import { EventEmitter } from 'events'
import sort from './sort'

export declare namespace System {

  export interface ResourceDescriptor {
    [resourceName: string]: any
  }

  export interface Dependency {
    component: string
    as?: string
    source?: string
  }

  export type StartFunction = (resources?: ResourceDescriptor, restart?: RestartFunction) => Promise<any>
  export type StopFunction = () => Promise<void>
  export type RestartFunction = () => void

  export interface Component {
    name?: string
    start: StartFunction
    stop?: StopFunction
    dependencies?: Dependency[]
  }

  export type ComponentDelta = {
    [p in keyof Component]?: Component[p]
  }

}

export class System extends EventEmitter {

  private components: System.Component[] = []

  private updateLast(delta: System.ComponentDelta): void {
    this.components = this.components.map(
      (component, i) => i === this.components.length - 1 ? { ...component, ...delta } : component
    )
  }

  public dependsOn(...deps: (string | System.Dependency)[]): this {
    this.updateLast({ dependencies: deps.map(createDependency) })
    return this
  }

  public add(name: string, component: System.Component): this {
    this.components = [
      ... this.components,
      { ...component, name, dependencies: [] }
    ]
    return this
  }

  public async start(): Promise<System.ResourceDescriptor> {
    const resources = await start(
      sort(this.components),
      {},
      () => { this.restart() },
      (componentName, resources) => this.emit('componentStart', componentName, resources)
    )
    this.emit('start', resources)
    return resources
  }

  public async stop(): Promise<void> {
    await stop(
      sort(this.components).reverse(),
      (componentName) => this.emit('componentStop', componentName)
    )
    this.emit('stop')
  }

  public async restart(): Promise<System.ResourceDescriptor> {
    await this.stop()
    const resources = await this.start()
    this.emit('restart', resources)
    return resources
  }
}

export default System

export function createDependency(dep: string | System.Dependency): System.Dependency {
  switch (typeof dep) {
    case 'string': return { component: <string>dep, as: <string>dep }
    case 'object':
      const {component, as, source} = <System.Dependency>dep
      if (!component) throw new Error(`'component' is required property on dependency component`)
      return { component, as: as || component, source }
    default: throw new Error(`Invalid dependency component: ${dep}`)
  }
}

export function filterResources(allResources: System.ResourceDescriptor, dependencies: System.Dependency[]) {
  const resources = {}
  Object.keys(allResources).forEach(resourceName => {
    const dependency = dependencies.filter(dep => dep.component === resourceName)[0] || null
    if (!dependency) return
    const {component, as, source} = dependency
    resources[as] = source ? allResources[component][source] : allResources[component]
  })
  return resources
}

export async function start(
  [first, ...others]: System.Component[],
  resources: System.ResourceDescriptor,
  restart: System.RestartFunction,
  onComponentStart: (componentName: string, resources: System.ResourceDescriptor) => void
): Promise<System.ResourceDescriptor> {
  if (!first) return resources
  const resource = await first.start(filterResources(resources, first.dependencies), restart)
  const extendedResources = { ...resources, [first.name]: resource }
  onComponentStart(first.name, extendedResources)
  return await start(others, extendedResources, restart, onComponentStart)
}

export async function stop(
  [first, ...others]: System.Component[],
  onComponentStop: (componentName: string) => void
): Promise<void> {
  if (!first) return
  if (first.stop) await first.stop()
  onComponentStop(first.name)
  return await stop(others, onComponentStop)
}