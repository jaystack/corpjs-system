import System from '../../src'

const dummyStartFunction = (resources: System.ResourceDescriptor, restart: System.RestartFunction) => {
  return new Promise((resolve: Function, reject: Function) => {
    return resolve(true)
  })
}

export const testedComponent = 'ExistingComponent'
export const testedMissingDependency = 'MissingComponent'
const componentsMissingDependency: System.Component[] = [
  { name: testedComponent, dependencies: [
    { component: 'AnotherExistingComponent' },
    { component: testedMissingDependency },
  ], start: dummyStartFunction },
  { name: 'AnotherExistingComponent', dependencies: [ ], start: dummyStartFunction }
]
export default componentsMissingDependency