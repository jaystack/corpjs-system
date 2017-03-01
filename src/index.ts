import { EventEmitter } from 'events'
import sort from './sort'

export declare namespace System {

  export interface Options {
    exitOnError?: boolean
  }

  export interface ResourceDescriptor {
    [resourceName: string]: any
  }

  export interface Dependency {
    component: string
    as?: string
    source?: string
  }

  export type ComponentStartFunction = (
    resources?: ResourceDescriptor,
    restart?: RestartFunction,
    stop?: StopFunction) => Promise<any>
  export type ComponentStopFunction = () => Promise<void>
  export type RestartFunction = () => void
  export type StopFunction = (error?: Error) => void

  export interface Component {
    name?: string
    start: ComponentStartFunction
    stop?: ComponentStopFunction
    dependencies?: Dependency[]
  }

  export type ComponentDelta = {
    [p in keyof Component]?: Component[p]
  }

}

export class System extends EventEmitter {

  private components: System.Component[] = []
  private options: System.Options
  private running: boolean = false

  constructor(options?: System.Options) {
    super()
    this.setOptions(options)
    this.listenSigint()
  }

  private setOptions(options: System.Options = {}) {
    this.options = {
      exitOnError: options.exitOnError === undefined ? true : false
    }
  }

  private listenSigint() {
    process.on('SIGINT', this.gracefulTerminate.bind(this, 'SIGINT'))
    process.on('SIGTERM', this.gracefulTerminate.bind(this, 'SIGTERM'))
  }

  private async gracefulTerminate(signal: string) {
    console.log(signal)
    if (this.running)
      await this.stop()
    process.exit(0)
  }

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

  public async start(
    initResources: System.ResourceDescriptor = {},
    restart: System.RestartFunction = () => { this.restart() },
    stop: System.StopFunction = (error?: Error) => { this.stop(error) }
  ): Promise<System.ResourceDescriptor> {
    try {
      const resources = await start(
        sort(this.components),
        initResources,
        restart,
        stop,
        (componentName, resources) => this.emit('componentStart', componentName, resources)
      )
      this.running = true
      this.emit('start', resources)
      return resources
    } catch (error) {
      if (this.options.exitOnError) {
        process.exit(1)
      } else {
        throw error
      }
    }
  }

  public async stop(error?: Error): Promise<void> {
    await stop(
      sort(this.components).reverse(),
      (componentName) => this.emit('componentStop', componentName)
    )
    this.running = false
    this.emit('stop', error)
    if (error && this.options.exitOnError)
      process.exit(1)
  }

  public async restart(): Promise<System.ResourceDescriptor> {
    await this.stop()
    const resources = await this.start()
    this.emit('restart', resources)
    return resources
  }

  public group(): System.Component {
    return {
      start: async (initResources: System.ResourceDescriptor, restart, stop) =>
        filterResources(initResources, await this.start(initResources, restart, stop)),
      stop: async () => await this.stop()
    }
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

export function mapResources(
  allResources: System.ResourceDescriptor,
  dependencies: System.Dependency[]
): System.ResourceDescriptor {
  const resources = {}
  Object.keys(allResources).forEach(resourceName => {
    const ownDependency = dependencies.find(dep => dep.component === resourceName)
    if (ownDependency) {
      const {component, as, source} = ownDependency
      resources[as] = source ? allResources[component][source] : allResources[component]
    } else {
      resources[resourceName] = allResources[resourceName]
    }
  })
  return resources
}

export function filterResources(
  initResources: System.ResourceDescriptor,
  subSystemResources: System.ResourceDescriptor
): System.ResourceDescriptor {
  const resources = { ...subSystemResources }
  Object.keys(initResources).forEach(
    resourceName => delete resources[resourceName]
  )
  return resources
}

export async function start(
  [first, ...others]: System.Component[],
  resources: System.ResourceDescriptor,
  restart: System.RestartFunction,
  stop: System.StopFunction,
  onComponentStart: (componentName: string, resources: System.ResourceDescriptor) => void
): Promise<System.ResourceDescriptor> {
  if (!first) return resources
  const resource = await first.start(mapResources(resources, first.dependencies), restart, stop)
  const extendedResources = { ...resources, [first.name]: resource }
  onComponentStart(first.name, extendedResources)
  return await start(others, extendedResources, restart, stop, onComponentStart)
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