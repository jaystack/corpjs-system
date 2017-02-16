import DependencySorter = require('dependency-sorter')
import { Component } from './types'

export function assertDependencies(components: Component[]): void {
  components.forEach(component => {
    component.dependencies.forEach(dep => {
      if (!components.find(({name}) => name === dep.component))
        throw new Error(`${component.name} has ${dep.component} dependency, but it does not exist in the system`)
    })
  })
}

function prepare(components: Component[]) {
  return components
    .map((component) => ({
      ...component,
      depends: component.dependencies.map(dep => dep.component)
    }))
}

export default function sort(components: Component[]): Component[] {
  assertDependencies(components)
  return new DependencySorter({ idProperty: 'name' })
    .sort(prepare(components))
    .map(component => { delete component.depends; return component })
}