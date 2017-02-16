import 'mocha'
import * as assert from 'assert'

import sort, {assertDependencies} from '../src/sort'

import componentsEmpty from './data/componentsEmpty'
import componentsWorking from './data/componentsWorking'
import componentsMissingDependency, {testedComponent, testedMissingDependency} from './data/componentsMissingDependency'
import componentsWorkingSorted from './data/componentsWorkingSorted'

describe('sort.ts', () => {

  describe('assertDependencies', () => {

    it('empty components array should not throw error', () => {
      assert.doesNotThrow( () => { assertDependencies(componentsEmpty) }, Error )
    })

    it('components array with existing dependencies should not throw error', () => {
      assert.doesNotThrow( () => { assertDependencies(componentsWorking) }, Error )
    })

    it('components array with dependency missing from components should throw error', () => {
      assert.throws( () => { assertDependencies(componentsMissingDependency) }, `${testedComponent} has ${testedMissingDependency} dependency, but it does not exist in the system` )
    })

  })

describe('sort', () => {

    it('empty components array should throw error', () => {
      assert.throws( () => { sort(componentsEmpty) }, Error )
    })

    it('working components array should not throw error', () => {
      assert.doesNotThrow( () => { sort(componentsWorking) }, Error )
    })

    it('working components array should return with correctly ordered components', () => {
      const orderedComponents = sort(componentsWorking)
      assert.deepEqual(orderedComponents.map(comp => comp.name), componentsWorkingSorted.map(comp => comp.name))
    })

  })

})