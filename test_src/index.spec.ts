import 'mocha'
import * as assert from 'assert'
import { fork } from 'child_process'
import System from '../src'

const expectedResources = {
  config: {
    timeout: 10
  },
  sleeper: {
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
    system = new System({ exitOnError: false })
      .add('config', config())
      .add('sleeper', sleeper()).dependsOn('config')
    const resources = await system.start()
    assert.deepEqual(resources, expectedResources)
  })

  it('should work if dependency provided as object of type Dependency', async () => {
    system = new System({ exitOnError: false })
      .add('config', config())
      .add('sleeper', sleeper()).dependsOn({ component: 'config' })
    const resources = await system.start()
    assert.deepEqual(resources, expectedResources)
  })

  it('should emit start', done => {
    system = new System({ exitOnError: false })
      .add('config', config())
      .add('sleeper', sleeper()).dependsOn({ component: 'config' })
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
    system = new System({ exitOnError: false })
      .add('config', config())
      .add('sleeper', sleeper()).dependsOn({ component: 'config' })
      .once('stop', () => done())
    system
      .start()
      .then(() => system.stop())
      .then(() => system = undefined)
      .catch(done)
  })

  it('should emit restart', done => {
    system = new System({ exitOnError: false })
      .add('config', config())
      .add('sleeper', sleeper()).dependsOn({ component: 'config' })
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
    system = new System({ exitOnError: false })
      .add('config', config())
      .add('sleeper', sleeper()).dependsOn({ component: 'config' })
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

  it('should emit componentStartFailed', done => {
    system = new System({ exitOnError: false })
      .add('defective', defective())
      .once('componentStartFailed', (name, err) => {
        try {
          assert.strictEqual(name, 'defective')
          assert.ok(err)
          done()
        } catch (err) {
          done(err)
        }
      })
    system.start()
  })

  it('should emit componentStop', done => {
    system = new System({ exitOnError: false })
      .add('config', config())
      .add('sleeper', sleeper()).dependsOn({ component: 'config' })
      .once('componentStop', componentName => {
        try {
          assert.strictEqual(componentName, 'sleeper')
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

  it('should emit componentStopFailed', done => {
    system = new System({ exitOnError: false })
      .add('insistent', insistent())
      .once('componentStopFailed', (name, err) => {
        try {
          assert.strictEqual(name, 'insistent')
          assert.ok(err)
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

  it('should emit componentRunFailed', done => {
    system = new System({ exitOnError: false })
      .add('partykiller', partykiller())
      .once('componentRunFailed', (name, err) => {
        try {
          assert.strictEqual(name, 'partykiller')
          assert.ok(err)
          done()
        } catch (err) {
          done(err)
        }
      })
    system.start()
  })

  it('ignorable component should not prevent system start', done => {
    system = new System({ exitOnError: false })
      .add('defective', defective()).ignorable()
      .once('stop', err => { if (err) done(err) })
    system.start().then(() => done())
  })

  it('component should stop the whole system with error', done => {
    system = new System({ exitOnError: false })
      .add('partykiller', partykiller())
      .once('stop', err => {
        try {
          assert.ok(/partykiller/.test(err.message))
          done()
        } catch (e) {
          done(e)
        }
      })
    system.start()
  })

  it('ignorable component should not stop the whole system with error', done => {
    system = new System({ exitOnError: false })
      .add('partykiller', partykiller()).ignorable()
      .once('stop', err => { if (err) done(err) })
    system.start().then(_ => {
      setTimeout(done, 20)
    })
  })

  it('system stopping does not throw exception when insistent component is ignorable', done => {
    system = new System({ exitOnError: false })
      .add('insistent', insistent()).ignorable()
      .once('stop', (_, stopErr) => {
        try {
          assert.ok(!stopErr)
          done()
        } catch (e) {
          done(e)
        }
      })
    system.start().then(_ => system.stop())
  })

  it('grouping', async () => {
    const subSystem = new System({ exitOnError: false })
      .add('sleeper', sleeper())
    system = new System({ exitOnError: false })
      .add('config', config())
      .add('subSystem', subSystem.group()).dependsOn('config')
    const resources = await system.start()
    assert.deepStrictEqual(resources, {
      config: { timeout: 10 },
      subSystem: { sleeper: { yeee: 'yeee' } }
    })
  })

  it('should exit process after empited event loop', done => {
    try {
      fork('test/test_src/normal-child-process')
        .on('exit', code => {
          if (code === 0) done()
          else done(new Error(`Exit code: ${code}`))
        })
        .on('error', err => done(err))
    } catch (err) {
      done(err)
    }
  })

  it('should exit process by caught exception at startup', done => {
    try {
      fork('test/test_src/early-defective-child-process')
        .on('exit', code => {
          if (code === 1) done()
          else done(new Error(`Exit code: ${code}`))
        })
        .on('error', err => done(err))
    } catch (err) {
      done(err)
    }
  })

  it('should exit process stop with exception', done => {
    try {
      fork('test/test_src/late-defective-child-process')
        .on('exit', code => {
          if (code === 1) done()
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

function sleeper() {
  let timeout
  return {
    async start({ config }) {
      timeout = config.timeout
      await sleep(timeout)
      return expectedResources.sleeper
    },
    async stop() {
      return await sleep(timeout)
    }
  }
}

function defective() {
  return {
    async start() {
      throw new Error("I'm defective, sorry")
    }
  }
}

function partykiller() {
  return {
    async start(_, __, stop) {
      setTimeout(() => stop(new Error("I'm a partykiller")), 10)
    }
  }
}

function insistent() {
  return {
    async start() {
      return null
    },
    async stop() {
      throw new Error("insistent")
    }
  }
}

function sleep(timeout): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(() => resolve(), timeout)
  })
}