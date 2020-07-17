// const { PerformanceObserver } = require('perf_hooks')

const { logger } = require('./Logger')
require('./TpClient.js')
require('./TradfriClient.js')

process.on('uncaughtException', (err) => {
  logger.error('uncaughtException')
  logger.error(err.message)
  logger.error(err.stack)
  process.exitCode = 1
})

// const obs = new PerformanceObserver(list => {
//   const entry = list.getEntries()[0]
//   logger.log(`Time for ('${entry.name}'): ${entry.duration}`)
// })
// obs.observe({ entryTypes: ['measure'], buffered: false })
