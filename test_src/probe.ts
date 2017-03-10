import System from '../src'

function Mock(t = 1000) {
  let timer
  return {
    async start() {
      timer = setInterval(() => {}, t)
    },
    async stop() {
      clearInterval(timer)
    }
  }
}

new System({ exitOnError: false })
  .add('mock1', Mock())
  .add('mock2', Mock()).dependsOn('mock1')
  .logAllEvents()
  .start()