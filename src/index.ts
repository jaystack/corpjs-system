import { EventEmitter } from 'events'
import sort from './sort'

export declare namespace System {

  export interface Options {
    name?: string
    exitOnError?: boolean
    stopTimeout?: number
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
  export type RestartFunction = (component: System.Component) => void
  export type StopFunction = (component: System.Component, error?: Error) => void

  export interface Component {
    name?: string
    start: ComponentStartFunction
    stop?: ComponentStopFunction
    dependencies?: Dependency[]
    mandatory?: boolean
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
    this.setOptions(options || {})
    this.listenSignals()
  }

  private setOptions({ name, exitOnError=true, stopTimeout=3000 }: System.Options) {
    this.options = { name, exitOnError, stopTimeout }
  }

  private listenSignals() {
    process.on('message', this.handleProcessMessage.bind(this))
    process.once('SIGINT', this.handleSignal.bind(this, 'SIGINT'))
    process.once('SIGTERM', this.handleSignal.bind(this, 'SIGTERM'))
    process.once('uncaughtException', this.handleUncaughtException.bind(this))
    process.once('unhandledRejection', this.handleUnhandledRejection.bind(this))
    process.once('exit', this.handleExit.bind(this))
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

  public ignorable(): this {
    this.updateLast({ mandatory: false })
    return this
  }

  public add(name: string, component: System.Component): this {
    this.components = [
      ... this.components,
      { ...component, name, dependencies: [], mandatory: true }
    ]
    return this
  }

  public async start(
    initResources: System.ResourceDescriptor = {},
    restart: System.RestartFunction = (component) => { this.restart() },
    stop: System.StopFunction = (component, error?) => {
      this.emit('componentRunFailed', component.name, error)
      if (component.mandatory) this.stop(error)
    }
  ): Promise<System.ResourceDescriptor> {
    try {
      const resources = await start(
        sort(this.components),
        initResources,
        restart,
        stop,
        (componentName, resources) => this.emit('componentStart', componentName, resources),
        (componentName, error) => this.emit('componentStartFailed', componentName, error)
      )
      this.running = true
      this.emit('start', resources)
      return resources
    } catch (error) {
      await this.stop(error)
      return {}
    }
  }

  public async stop(error?: Error): Promise<void> {
    await stop(
      sort(this.components).reverse(),
      (componentName) => this.emit('componentStop', componentName),
      (componentName, error) => this.emit('componentStopFailed', componentName, error)
    )
    this.running = false
    this.emit('stop', error)
    this.handleError(error)
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

  public logAllEvents(): this {
    const systemName = this.options.name
    return this
      .on('start', resources => console.log(`${systemName || 'System'} started`))
      .on('stop', err => console.log(`${systemName || 'System'} stopped`, err || ''))
      .on('restart', resources => console.log(`${systemName || 'System'} restarted`))
      .on('componentStart', (name, resources) => console.log(`Component started: ${name}`))
      .on('componentStartFailed', (name, err) => console.log(`Component start failed: ${name}`, err))
      .on('componentStop', name => console.log(`Component stopped: ${name}`))
      .on('componentStopFailed', (name, err) => console.log(`Component stop failed: ${name}`, err))
      .on('stopTimeout', timeout => console.log(`Stop timeout: ${timeout}`))
      .on('componentRunFailed', (name, err) => console.log(`Component run failed: ${name}`, err))
      .on('uncaughtException', err => console.log(`UncaughtException`, err))
      .on('unhandledRejection', err => console.log(`UnhandledRejection`, err))
      .on('terminate', signal => console.log(signal))
      .on('exit', code => console.log(`Exit with code: ${code}`))
  }

  private handleProcessMessage(msg: string) {
    if (msg === 'shutdown') {
      this.emit('terminate', msg)
      this.gracefulTerminate()
    }
  }

  private handleSignal(signal: string) {
    this.emit('terminate', signal)
    this.gracefulTerminate()
  }

  private handleUncaughtException(error: Error) {
    this.emit('uncaughtException', error)
    process.once('uncaughtException', this.handleError.bind(this))
    this.gracefulTerminate()
  }

  private handleUnhandledRejection(error: Error) {
    this.emit('unhandledRejection', error)
    process.once('unhandledRejection', this.handleError.bind(this))
    this.gracefulTerminate()
  }

  private handleStopTimeout() {
    this.emit('stopTimeout', this.options.stopTimeout)
    this.exit(1)
  }

  private handleError(error?: Error) {
    if (error && this.options.exitOnError)
      this.exit(1)
  }

  private handleExit(code) {
    this.emit('exit', code)
  }

  private async gracefulTerminate() {
    setTimeout(this.handleStopTimeout.bind(this), this.options.stopTimeout)
    if (this.running)
      await this.stop()
    this.exit(0)
  }

  private exit(code: number) {
    process.exit(code)
  }
}

export default System

export function createDependency(dep: string | System.Dependency): System.Dependency {
  switch (typeof dep) {
    case 'string': return { component: <string>dep, as: <string>dep }
    case 'object':
      const { component, as, source } = <System.Dependency>dep
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
      const { component, as, source } = ownDependency
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
  onComponentStart: (componentName: string, resources: System.ResourceDescriptor) => void,
  onComponentStartFailed: (componentName: string, error: Error) => void
): Promise<System.ResourceDescriptor> {
  if (!first) return resources
  let resource
  try {
    resource = await first.start(mapResources(resources, first.dependencies), restart.bind(null, first), stop.bind(null, first))
  } catch (err) {
    onComponentStartFailed(first.name, err)
    if (first.mandatory) throw err
    return await start(others, resources, restart, stop, onComponentStart, onComponentStartFailed)
  }
  const extendedResources = { ...resources, [first.name]: resource }
  onComponentStart(first.name, extendedResources)
  return await start(others, extendedResources, restart, stop, onComponentStart, onComponentStartFailed)
}

export async function stop(
  [first, ...others]: System.Component[],
  onComponentStop: (componentName: string) => void,
  onComponentStopFailed: (componentName: string, error: Error) => void
): Promise<void> {
  if (!first) return
  try {
    if (first.stop) await first.stop()
    onComponentStop(first.name)
  } catch (err) {
    onComponentStopFailed(first.name, err)
  }
  return await stop(others, onComponentStop, onComponentStopFailed)
}