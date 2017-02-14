export interface Params {
  name?: string
}

export type Callback<Result> = (err: Error, result: Result) => void

export interface Component<Result> {
  start?(cb: Callback<Result>): void
  start?(deps, cb: Callback<Result>): void
  stop?(cb: Callback<void>): void
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

export default class System {
  name: string
  bootstrap(path: string): System
  configure(component: Component<any>): System
  add(componentName: string, component: Component<any>, options: Object): System
  set(componentName: string, component: Component<any>, options: Object): System
  remove(componentName: string): System
  include(System): System
  merge(System): System
  dependsOn(...dependencies: (string | Dependency)[]): System
  start(cb: Callback<Component<any>[]>): System
  stop(cb: Callback<Component<any>[]>): System
  restart(cb: Callback<Component<any>[]>): System
  definitions: Definitions
}