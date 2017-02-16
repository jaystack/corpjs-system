import System from '../../src'

const dummyStartFunction = (resources: System.ResourceDescriptor, restart: System.RestartFunction) => {
  return new Promise((resolve: Function, reject: Function) => {
    return resolve(true)
  })
}

const componentsWorkingSorted: System.Component[] = [
  { name: 'YetAnotherExistingComponent', dependencies: [ ], start: dummyStartFunction },
  { name: 'AnotherExistingComponent', dependencies: [ ], start: dummyStartFunction },
  { name: 'ExistingComponent', dependencies: [
    { component: 'AnotherExistingComponent' },
    { component: 'YetAnotherExistingComponent' },
  ], start: dummyStartFunction },
]
export default componentsWorkingSorted