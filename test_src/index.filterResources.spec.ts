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
      "ResourceA": "A",
      "ResourceB": "B"
    }
    const dependencies: System.Dependency[] = [
      { component: "ResourceA", as: "ResourceA" },
      { component: "ResourceB", as: "ResourceB" },
    ]
    const expectedResourcesResult: System.ResourceDescriptor = {
      "ResourceA": "A",
      "ResourceB": "B"
    }
    const resourcesResult = filterResources(resources, dependencies)
    assert.deepEqual(expectedResourcesResult, resourcesResult)
  })

  it('missing element in resources should be skipped', () => {
    const resources: System.ResourceDescriptor = {
      "ResourceA": "A",
    }
    const dependencies: System.Dependency[] = [
      { component: "ResourceA", as: "ResourceA" },
      { component: "ResourceB", as: "ResourceB" },
    ]
    const expectedResourcesResult: System.ResourceDescriptor = {
      "ResourceA": "A",
    }
    const resourcesResult = filterResources(resources, dependencies)
    assert.deepEqual(expectedResourcesResult, resourcesResult)
  })

  it('missing element in dependencies should be skipped', () => {
    const resources: System.ResourceDescriptor = {
      "ResourceA": "A",
      "ResourceB": "B"
    }
    const dependencies: System.Dependency[] = [
      { component: "ResourceA", as: "ResourceA" },
    ]
    const expectedResourcesResult: System.ResourceDescriptor = {
      "ResourceA": "A",
    }
    const resourcesResult = filterResources(resources, dependencies)
    assert.deepEqual(expectedResourcesResult, resourcesResult)
  })

  it('should resolve source', () => {
    const resources: System.ResourceDescriptor = {
      "ResourceA": { "SourceA": "A" },
      "ResourceB": "B"
    }
    const dependencies: System.Dependency[] = [
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

  it('should skip missing elements on both sides', () => {
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