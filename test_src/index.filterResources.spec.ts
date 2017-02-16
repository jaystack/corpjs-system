import 'mocha'
import * as assert from 'assert'
import System, {filterResources} from '../src'

describe('corpjs-system / filterResources', () => {

  it('should not throw error for empty array', () => {
    const resourcesEmpty: System.ResourceDescriptor = []
    const dependenciesEmpty: System.Dependency[] = []
    const resourcesResult = filterResources(resourcesEmpty, dependenciesEmpty)
    assert.deepEqual(resourcesResult, [])
  })

  it('should work', () => {
    const resources: System.ResourceDescriptor = {
      "ResourceMissingFromDependencies": "Missing",
      "ResourceA": { "SourceA": "A" },
      "ResourceB": "B"
    }
    const dependencies: System.Dependency[] = [
      { component: "ResourceMissingFromAllResources", as: "ResourceMissingFromAllResources" },
      { component: "ResourceA", as: "A", source: "SourceA" },
      { component: "ResourceB", as: "ResourceB" },
    ]
    const expectedResourcesResult: System.ResourceDescriptor = {
      "A": "A",
      "ResourceB": "B"
    }
    const resourcesResult = filterResources(resources, dependencies)
    assert.deepEqual(expectedResourcesResult, resourcesResult)
  })

})

function config() {
  return {
    async start(deps) {
      return { timeout: 100 }
    },
    async stop() {
      console.log('stop config')
    }
  }
}

function something() {
  let timeout
  return {
    async start({config}) {
      timeout = config.timeout
      await sleep(timeout)
      return { yeee: 'yeee' }
    },
    async stop() {
      console.log('stop something')
      return await sleep(timeout)
    }
  }
}

function sleep(timeout): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(() => resolve(), timeout)
  })
}