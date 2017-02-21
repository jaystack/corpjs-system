import System from '../src'

(async () => {
  const system = new System()
    .add('mock', mockComponent())
  await system.start()
})()

function mockComponent() {

  let timer: NodeJS.Timer

  return {
    async start() {
      throw new Error("Early defective")
    }
  }
}