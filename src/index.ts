import { Component, ComponentDelta, Dependency, ResourceDescriptor, StartFunction, StopFunction, RestartFunction } from './types'
import sort from './sort'

export default class System {

  private components: Component[] = []

  private updateLast(delta: ComponentDelta): void {
    this.components = this.components.map(
      (component, i) => i === this.components.length - 1 ? { ...component, ...delta } : component
    )
  }

  public as(name: string): this {
    this.updateLast({ name })
    return this
  }

  public dependsOn(...deps: (string | Dependency)[]): this {
    this.updateLast({ dependencies: deps.map(createDependency) })
    return this
  }

  public add(component: Component): this {
    this.components = [
      ... this.components,
      { ...component, dependencies: [] }
    ]
    return this
  }

  public async start(): Promise<ResourceDescriptor> {
    return await start(sort(this.components), {}, this.restart.bind(this))
  }

  public async stop(): Promise<void> {
    return await stop(sort(this.components).reverse())
  }

  public async restart(): Promise<ResourceDescriptor> {
    await this.stop()
    return await this.start()
  }
}

export function createDependency(dep: string | Dependency): Dependency {
  switch (typeof dep) {
    case 'string': return { component: <string>dep, as: <string>dep }
    case 'object':
      const {component, as, source} = <Dependency>dep
      if (!component) throw new Error(`'component' is required property on dependency component`)
      return { component, as: as || component, source }
    default: throw new Error(`Invalid dependency component: ${dep}`)
  }
}

export function filterResources(allResources: ResourceDescriptor, dependencies: Dependency[]) {
  const resources = {}
  Object.keys(allResources).forEach(resourceName => {
    const dependency = dependencies.find(dep => dep.component === resourceName)
    if (!dependency) return
    const {component, as, source} = dependency
    resources[as] = source ? allResources[component][source] : allResources[component]
  })
  return resources
}

export async function start([first, ...others]: Component[], resources: ResourceDescriptor, restart: RestartFunction): Promise<ResourceDescriptor> {
  if (!first) return resources
  const resource = await first.start(filterResources(resources, first.dependencies), restart)
  return await start(others, { ...resources, [first.name]: resource }, restart)
}

export async function stop([first, ...others]: Component[]): Promise<void> {
  if (!first) return
  if (first.stop) await first.stop()
  return await stop(others)
}