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