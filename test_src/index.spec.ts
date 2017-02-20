import 'mocha'
import * as assert from 'assert'
import { fork } from 'child_process'
import System from '../src'

const expectedResources = {
  config: {
    timeout: 10
  },
  something: {
    yeee: 'yeee'
  }
}

describe('corpjs-system', () => {

  let system

  beforeEach(async () => {
    if (!system) return
    await system.stop()
    system = undefined
  })

  it('should work if dependency provided as string', async () => {
    system = new System()
      .add('config', config())
      .add('something', something()).dependsOn('config')
    const resources = await system.start()
    assert.deepEqual(resources, expectedResources)
  })

  it('should work if dependency provided as object of type Dependency', async () => {
    system = new System()
      .add('config', config())
      .add('something', something()).dependsOn({ component: 'config' })
    const resources = await system.start()
    assert.deepEqual(resources, expectedResources)
  })

  it('should emit start', done => {
    system = new System()
      .add('config', config())
      .add('something', something()).dependsOn({ component: 'config' })
      .once('start', resources => {
        try {
          assert.deepEqual(resources, expectedResources)
          done()
        } catch (err) {
          done(err)
        }
      })
    system.start().catch(done)
  })

  it('should emit stop', done => {
    system = new System()
      .add('config', config())
      .add('something', something()).dependsOn({ component: 'config' })
      .once('stop', () => done())
    system
      .start()
      .then(() => system.stop())
      .then(() => system = undefined)
      .catch(done)
  })

  it('should emit restart', done => {
    system = new System()
      .add('config', config())
      .add('something', something()).dependsOn({ component: 'config' })
      .once('restart', resources => {
        try {
          assert.deepEqual(resources, expectedResources)
          done()
        } catch (err) {
          done(err)
        }
      })
    system
      .start()
      .then(() => system.restart())
      .catch(done)
  })

  it('should emit componentStart', done => {
    system = new System()
      .add('config', config())
      .add('something', something()).dependsOn({ component: 'config' })
      .once('componentStart', (componentName, resources) => {
        try {
          assert.strictEqual(componentName, 'config')
          assert.deepEqual(resources, { config: expectedResources.config })
          done()
        } catch (err) {
          done(err)
        }
      })
    system
      .start()
      .catch(done)
  })

  it('should emit componentStop', done => {
    system = new System()
      .add('config', config())
      .add('something', something()).dependsOn({ component: 'config' })
      .once('componentStop', componentName => {
        try {
          assert.strictEqual(componentName, 'something')
          done()
        } catch (err) {
          done(err)
        }
      })
    system
      .start()
      .then(() => system.stop())
      .catch(done)
  })

  it('component should stop the whole system', done => {
    system = new System()
      .add('partykiller', partykiller())
      .once('stop', () => done())
    system.start()
  })

  it('should exit process after stop the System', done => {
    try {
      fork('test/test_src/child-process')
      .on('exit', code => {
        if (code === 0) done()
        else done(new Error(`Exit code: ${code}`))
      })
      .on('error', err => done(err))
    } catch (err) {
      done(err)
    }
  })

})

function config() {
  return {
    async start(deps) {
      return expectedResources.config
    }
  }
}

function something() {
  let timeout
  return {
    async start({config}) {
      timeout = config.timeout
      await sleep(timeout)
      return expectedResources.something
    },
    async stop() {
      return await sleep(timeout)
    }
  }
}

function partykiller() {
  return {
    async start(_, __, stop) {
      setTimeout(stop, 10)
    }
  }
}

function sleep(timeout): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(() => resolve(), timeout)
  })
}