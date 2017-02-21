import System from '../src'

(async () => {
  const system = new System()
    .add('mock', mockComponent())
    .on('restart', () => {})
  await system.start()
  setTimeout(() => {
    system.stop()
  }, 20)
})()

function mockComponent() {

  let timer: NodeJS.Timer

  return {
    async start() {
      timer = setInterval(() => {}, 5)
    },
    async stop() {
      clearTimeout(timer)
    }
  }
}