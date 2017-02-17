import 'mocha'
import * as assert from 'assert'
import System from '../src'

import * as debugModule from "debug"

describe('acceptance tests / corpjs-system', () => {
  const logTrace = (message: string) => {
    logTracer.push(message)
    debugModule("corpjs-system:test:acceptance:index.acc")(message)
  }

  let configTimeout = 100

  let startCounter = 0
  let stopCounter = 0
  let sequenceTracer = {}
  let logTracer = []

  const resetCountersAndTracers = () => {
    startCounter = 0
    stopCounter = 0
    sequenceTracer = {}
    logTracer = []
    configTimeout = 100
  }

  const initialState = () => ({
    started: false,
    startSequence: 0,
    stopped: false,
    stopSequence: 0,
  })

  const addTrace = (sequenceTracer: any, name: string, startStop: string, sequenceNumber: number) => {
    let propName: string =
      (startStop === "start" || startStop === "stop") ? `${startStop}#${sequenceNumber}` : undefined
    let myObj = {}
    myObj[propName] = name
    return (propName) ? Object.assign(sequenceTracer, myObj) : sequenceTracer
  }

  function config(restartTimeout: number = undefined) {
    let state = initialState()
    return {
      async start(deps, restart) {
        state.started = true
        state.startSequence = ++startCounter
        sequenceTracer = addTrace(sequenceTracer, "config", "start", startCounter)
        logTrace(`start config #${startCounter} { timeout: ${configTimeout} }`)

        if (restartTimeout) {
          sleep(restartTimeout, "[config changed, restarting]")
            .then(() => {
              restart()
            })
        }

        return { timeout: configTimeout }
      },
      async stop() {
        state.stopped = true
        state.stopSequence = ++stopCounter
        sequenceTracer = addTrace(sequenceTracer, "config", "stop", stopCounter)
        logTrace(`stop config #${stopCounter} { timeout: ${configTimeout} }`)
      },
    }
  }

  function logger() {
    let state = initialState()
    let timeout
    return {
      async start(deps) {
        state.started = true
        state.startSequence = ++startCounter
        sequenceTracer = addTrace(sequenceTracer, "logger", "start", startCounter)
        logTrace(`start logger #${startCounter}`)
        return { timeout: 200 }
      },
      async stop() {
        state.stopped = true
        state.stopSequence = ++stopCounter
        sequenceTracer = addTrace(sequenceTracer, "logger", "stop", stopCounter)
        logTrace(`stop logger #${stopCounter}`)
      }
    }
  }

  function businessLogic() {
    let state = initialState()
    let timeout
    return {
      async start({config, logger}) {
        state.started = true
        state.startSequence = ++startCounter
        sequenceTracer = addTrace(sequenceTracer, "businessLogic", "start", startCounter)
        logTrace(`start businessLogic #${startCounter}`)
        await sleep(config.timeout, '(end of config timeout)')
        await sleep(logger.timeout, '(end of logger timeout)')
        return { business: 'logic' }
      },
      async stop() {
        state.stopped = true
        state.stopSequence = ++stopCounter
        sequenceTracer = addTrace(sequenceTracer, "businessLogic", "stop", stopCounter)
        logTrace(`stop businessLogic #${stopCounter}`)
        return await sleep(timeout)
      }
    }
  }

  function sleep(timeout, message?: string): Promise<void> {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        if (message) logTrace(message)
        return resolve()
      }, timeout)
    })
  }

  let system: System

  describe('system simply starts and stops', () => {
    it('should work - no restarting', async () => {
      resetCountersAndTracers()
      system = new System()
        .add('config', config())
        .add('logger', logger()).dependsOn('config')
        .add('businessLogic', businessLogic()).dependsOn('config', 'logger')
      const resources = await system.start()
      assert.deepEqual(resources, { config: { timeout: 100 }, logger: { timeout: 200 }, businessLogic: { business: "logic" } })

      await system.stop()
      const expectedSequenceTracer = {
        "start#1": "config",
        "start#2": "logger",
        "start#3": "businessLogic",
        "stop#1": "businessLogic",
        "stop#2": "logger",
        "stop#3": "config",
      }
      assert.deepEqual(sequenceTracer, expectedSequenceTracer)

      const expectedLogTracer = [
        "start config #1 { timeout: 100 }",
        "start logger #2",
        "start businessLogic #3",
        "(end of config timeout)",
        "(end of logger timeout)",
        "stop businessLogic #1",
        "stop logger #2",
        "stop config #3 { timeout: 100 }",
      ]
      assert.deepEqual(logTracer, expectedLogTracer)
    })
  })

  describe('system starts, then config changes and sismtem restarts, then stops', () => {

    let resourcesAfterInitialStart
    let resourcesAfterRestart

    before(async () => {
      resetCountersAndTracers()
      system = new System()
      system
        .add('config', config())
        .add('logger', logger()).dependsOn('config')
        .add('businessLogic', businessLogic()).dependsOn('config', 'logger')
      resourcesAfterInitialStart = await system.start()

      await sleep(50, "[config 'changed' & being restarted]")
        .then(async () => {
          configTimeout = 150
          logTrace("[being restarted]")
          resourcesAfterRestart = await system.restart()
          logTrace("[just restarted]")
        })

      await system.stop()
    })

    it('system starts in a normal way', async () => {
      assert.deepEqual(resourcesAfterInitialStart, { config: { timeout: 100 }, logger: { timeout: 200 }, businessLogic: { business: "logic" } })
    })

    it('config chages so system restarts, resources got changed', async () => {
      assert.deepEqual(resourcesAfterRestart, { config: { timeout: 150 }, logger: { timeout: 200 }, businessLogic: { business: "logic" } })
    })

    it('at stopping sequenceTrace must be "doubled"', async () => {
      const expectedSequenceTracer = {
        "start#1": "config",
        "start#2": "logger",
        "start#3": "businessLogic",
        "stop#1": "businessLogic",
        "stop#2": "logger",
        "stop#3": "config",
        "start#4": "config",
        "start#5": "logger",
        "start#6": "businessLogic",
        "stop#4": "businessLogic",
        "stop#5": "logger",
        "stop#6": "config",    }
      assert.deepEqual(sequenceTracer, expectedSequenceTracer)
    })

    it('at stopping sequenceTrace must be "doubled"', async () => {
      const expectedLogTracer = [
        "start config #1 { timeout: 100 }",
        "start logger #2",
        "start businessLogic #3",
        "(end of config timeout)",
        "(end of logger timeout)",
        "[config 'changed' & being restarted]",
        "[being restarted]",
        "stop businessLogic #1",
        "stop logger #2",
        "stop config #3 { timeout: 150 }",
        "start config #4 { timeout: 150 }",
        "start logger #5",
        "start businessLogic #6",
        "(end of config timeout)",
        "(end of logger timeout)",
        "[just restarted]",
        "stop businessLogic #4",
        "stop logger #5",
        "stop config #6 { timeout: 150 }",
      ]
      assert.deepEqual(logTracer, expectedLogTracer)
    })

  })

  describe('component config restart makes the system restarted', () => {

    let resourcesAfterInitialStart
    let resourcesAfterRestart

    before(async () => {
      resetCountersAndTracers()
      system = new System()
      system
        .add('config', config(500))
        .add('logger', logger()).dependsOn('config')
        .add('businessLogic', businessLogic()).dependsOn('config', 'logger')
      resourcesAfterInitialStart = await system.start()

      system.on('restart', (resources: System.ResourceDescriptor) => { resourcesAfterRestart = resources })

      await sleep(1000)
      await system.stop()
    })

    it('system starts in a normal way', async () => {
      assert.deepEqual(resourcesAfterInitialStart, { config: { timeout: 100 }, logger: { timeout: 200 }, businessLogic: { business: "logic" } })
    })

    it('config chages so system restarts, resources got changed', async () => {
      assert.deepEqual(resourcesAfterRestart, { config: { timeout: 150 }, logger: { timeout: 200 }, businessLogic: { business: "logic" } })
    })

  })

})