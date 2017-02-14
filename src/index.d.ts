export interface Params {
  name?: string
}

export type ComponentCallback<Result> = (err?: Error, result?: Result) => void
export type SystemCallback<Components> = (err?: Error, system?: Components) => void

export interface Component<Result> {
  start?(cb: ComponentCallback<Result>): void
  start?(deps: { [dependencyName: string]: any }, cb: ComponentCallback<Result>): void
  stop?(cb: ComponentCallback<void>): void
}

export interface Dependency {
  source?: string
  destination?: string
  component?: string
}

export interface Definition {
  name: string
  component: Component<any>
  dependencies: Dependency[]
}

export interface Definitions {
  [componentName: string]: Definition
}

export default class System<Components> {
  constructor(params?: Params)
  name: string
  bootstrap(path: string): this
  configure(component: Component<any>): this
  add(componentName: string, component: Component<any>, options?: Object): this
  set(componentName: string, component: Component<any>, options?: Object): this
  remove(componentName: string): this
  include(System): this
  merge(System): this
  dependsOn(...dependencies: (string | Dependency)[]): this
  start(cb?: SystemCallback<Components>): this
  stop(cb?: SystemCallback<Components>): this
  restart(cb?: SystemCallback<Components>): this
  definitions: Definitions
}