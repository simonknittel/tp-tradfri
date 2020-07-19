// const { PerformanceObserver } = require('perf_hooks')

const { logger } = require('./Logger')
require('./TpClient')
require('./TradfriClient/index')

process.on('uncaughtException', (err) => {
  logger.error('uncaughtException')
  logger.error(err.message)
  logger.error(err.stack)
  process.exitCode = 1
})
