import {Component, Dependency, StartFunction, ResourceDescriptor, RestartFunction} from '../../src/types'

const dummyStartFunction = (resources: ResourceDescriptor, restart: RestartFunction) => {
  return new Promise((resolve: Function, reject: Function) => {
    return resolve(true)
  })
}

export const testedComponent = 'ExistingComponent'
export const testedMissingDependency = 'MissingComponent'
const componentsMissingDependency: Component[] = [
  { name: testedComponent, dependencies: [
    { component: 'AnotherExistingComponent' },
    { component: testedMissingDependency },
  ], start: dummyStartFunction },
  { name: 'AnotherExistingComponent', dependencies: [ ], start: dummyStartFunction }
]
export default componentsMissingDependency