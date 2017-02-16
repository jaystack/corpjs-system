import System from '../../src'

const dummyStartFunction = (resources: System.ResourceDescriptor, restart: System.RestartFunction) => {
  return new Promise((resolve: Function, reject: Function) => {
    return resolve(true)
  })
}

const componentsWorking: System.Component[] = [
  { name: 'AnotherExistingComponent', dependencies: [ ], start: dummyStartFunction }, // Order is intentional (puposeful)
  { name: 'ExistingComponent', dependencies: [
    { component: 'AnotherExistingComponent' },
    { component: 'YetAnotherExistingComponent' },
  ], start: dummyStartFunction },
  { name: 'YetAnotherExistingComponent', dependencies: [ ], start: dummyStartFunction },
]
export default componentsWorking