import 'mocha'
import * as assert from 'assert'
import System, { mapResources } from '../src'

describe('corpjs-system / mapResources', () => {

  it('should not throw error for empty array', () => {
    const resourcesEmpty: System.ResourceDescriptor = []
    const dependenciesEmpty: System.Dependency[] = []
    const resourcesResult = mapResources(resourcesEmpty, dependenciesEmpty)
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
    const resourcesResult = mapResources(resources, dependencies)
    assert.deepEqual(expectedResourcesResult, resourcesResult)
  })

  it('should get not required resources 1', () => {
    const resources: System.ResourceDescriptor = {
      "ResourceA": "A",
      "ResourceB": "B"
    }
    const dependencies: System.Dependency[] = [
      { component: "ResourceA", as: "ResourceA" },
    ]
    const expectedResourcesResult: System.ResourceDescriptor = {
      "ResourceA": "A",
      "ResourceB": "B"
    }
    const resourcesResult = mapResources(resources, dependencies)
    assert.deepEqual(expectedResourcesResult, resourcesResult)
  })

  it('should get not required resources 2', () => {
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
      "ResourceB": "B",
      "ResourceMissingFromDependencies": "Missing"
    }
    const resourcesResult = mapResources(resources, dependencies)
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
    const resourcesResult = mapResources(resources, dependencies)
    assert.deepEqual(expectedResourcesResult, resourcesResult)
  })

})