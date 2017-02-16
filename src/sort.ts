import DependencySorter = require('dependency-sorter')
import System from '.'

export function assertDependencies(components: System.Component[]): void {
  components.forEach(component => {
    component.dependencies.forEach(dep => {
      if (!components.find(({name}) => name === dep.component))
        throw new Error(`${component.name} has ${dep.component} dependency, but it does not exist in the system`)
    })
  })
}

function prepare(components: System.Component[]) {
  return components
    .map((component) => ({
      ...component,
      depends: component.dependencies.map(dep => dep.component)
    }))
}

export default function sort(components: System.Component[]): System.Component[] {
  if (Array.isArray(components) && components.length === 1) return components
  assertDependencies(components)
  return new DependencySorter({ idProperty: 'name' })
    .sort(prepare(components))
    .map(component => { delete component.depends; return component })
}