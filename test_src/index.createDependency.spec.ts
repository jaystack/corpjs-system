import 'mocha'
import * as assert from 'assert'
import System, {createDependency} from '../src'

describe('corpjs-system / createDependency', () => {

  it('should throw error if .component is missing from parameter object', (done) => {
    assert.throws(() => { createDependency(<System.Dependency>{}) }, Error)
    done()
  })

  it('for a string parameter it should return a dependency object (both .component and .as equal string parameter value)', () => {
    const result = createDependency("A")
    assert.deepEqual(result, { component: "A", as: "A" })
  })

  it('for a dependency object parameter wo/ .as it should return a dependency object where .as == .component & add .source: undefined', () => {
    const result = createDependency({ component: "A" })
    assert.deepEqual(result, { component: "A", as: "A", source: undefined })
  })

  it('for a dependency object parameter w/ .as it should return a dependency object where .as is not modified & add .source: undefined', () => {
    const result = createDependency({ component: "A", as: "_A_" })
    assert.deepEqual(result, { component: "A", as: "_A_", source: undefined })
  })

    it('for a dependency object parameter w/ .as and .source it should return a dependency object having the same data', () => {
    const result = createDependency({ component: "A", as: "_A_", source: "SourceA" })
    assert.deepEqual(result, { component: "A", as: "_A_", source: "SourceA" })
  })

})