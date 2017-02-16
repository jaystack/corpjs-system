import {Component, Dependency, StartFunction, ResourceDescriptor, RestartFunction} from '../../src/types'

const dummyStartFunction = (resources: ResourceDescriptor, restart: RestartFunction) => {
  return new Promise((resolve: Function, reject: Function) => {
    return resolve(true)
  })
}

export const testedComponent = 'ExistingComponent'
export const testedMissingDependency = 'MissingComponent'
const componentsWorking: Component[] = [
  { name: 'ExistingComponent', dependencies: [
    { component: 'AnotherExistingComponent' },
    { component: 'YetAnotherExistingComponent' },
  ], start: dummyStartFunction },
  { name: 'AnotherExistingComponent', dependencies: [ ], start: dummyStartFunction },
  { name: 'YetAnotherExistingComponent', dependencies: [ ], start: dummyStartFunction }
]
export default componentsWorking