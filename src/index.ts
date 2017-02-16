import sort from './sort'

export default System

class System {

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
    return await start(sort(this.components), {}, this.restart.bind(this))
  }

  public async stop(): Promise<void> {
    return await stop(sort(this.components).reverse())
  }

  public async restart(): Promise<System.ResourceDescriptor> {
    await this.stop()
    return await this.start()
  }
}

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
    const dependency = dependencies.find(dep => dep.component === resourceName)
    if (!dependency) return
    const {component, as, source} = dependency
    resources[as] = source ? allResources[component][source] : allResources[component]
  })
  return resources
}

export async function start([first, ...others]: System.Component[], resources: System.ResourceDescriptor, restart: System.RestartFunction): Promise<System.ResourceDescriptor> {
  if (!first) return resources
  const resource = await first.start(filterResources(resources, first.dependencies), restart)
  return await start(others, { ...resources, [first.name]: resource }, restart)
}

export async function stop([first, ...others]: System.Component[]): Promise<void> {
  if (!first) return
  if (first.stop) await first.stop()
  return await stop(others)
}

declare namespace System {

  export interface ResourceDescriptor {
    [resourceName: string]: any
  }

  export interface Dependency {
    component: string
    as?: string
    source?: string
  }

  export type StartFunction = (resources: ResourceDescriptor, restart: RestartFunction) => Promise<any>
  export type StopFunction = () => Promise<void>
  export type RestartFunction = () => Promise<any>

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