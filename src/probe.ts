import System from '.'

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
  .on('componentStart', (componentName: string) => console.log(`Started component: ${componentName}`))
  .on('componentStop', (componentName: string) => console.log(`Stopped component: ${componentName}`))
  .on('start', resources => console.log(`Started service`))
  .on('stop', err => console.log(`Stopped service`))
  .on('terminate', signal => console.log(signal))
  .start()