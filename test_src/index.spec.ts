import 'mocha'
import * as assert from 'assert'
import System from '../src'

describe('corpjs-system', () => {

  it('should work', async () => {
    const system = new System()
      .add('config', config())
      .add('something', something()).dependsOn('config')
    const resources = await system.start()
    assert.deepEqual(resources, { config: { timeout: 100 }, something: { yeee: 'yeee' } })
    await system.stop()
  })

  it('should work', async () => {
    const system = new System()
      .add('config', config())
      .add('something', something()).dependsOn({ component: 'config' })
    const resources = await system.start()
    assert.deepEqual(resources, { config: { timeout: 100 }, something: { yeee: 'yeee' } })
    await system.stop()
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