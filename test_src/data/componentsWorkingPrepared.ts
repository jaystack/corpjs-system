import System from '../../src'

const dummyStartFunction = (resources: System.ResourceDescriptor, restart: System.RestartFunction) => {
  return new Promise((resolve: Function, reject: Function) => {
    return resolve(true)
  })
}

const componentsWorkingPrepared: any[] = [
  { name: 'AnotherExistingComponent', dependencies: [ ], depends: [ ], start: dummyStartFunction }, // Order is intentional (puposeful)
  { name: 'ExistingComponent', dependencies: [
    { component: 'AnotherExistingComponent' },
    { component: 'YetAnotherExistingComponent' },
  ], depends: [
    'AnotherExistingComponent',
    'YetAnotherExistingComponent',
  ], start: dummyStartFunction },
  { name: 'YetAnotherExistingComponent', dependencies: [ ], depends: [ ], start: dummyStartFunction },
]
export default componentsWorkingPrepared