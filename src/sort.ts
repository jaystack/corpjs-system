import DependencySorter = require('dependency-sorter')
import { Component } from './types'

function prepare(components: Component[]) {
  return components
    .map((component) => ({
      ...component,
      depends: component.dependencies.map(dep => dep.component)
    }))
}

export default function sort(components: Component[]): Component[] {
  return new DependencySorter({ idProperty: 'name' })
    .sort(prepare(components))
    .map(component => { delete component.depends; return component })
}