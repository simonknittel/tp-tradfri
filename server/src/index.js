const { PerformanceObserver } = require('perf_hooks')

const { logger } = require('./Logger')
require('./TpClient.js')

// const obs = new PerformanceObserver(list => {
//   const entry = list.getEntries()[0]
//   logger.log(`Time for ('${entry.name}'): ${entry.duration}`)
// })
// obs.observe({ entryTypes: ['measure'], buffered: false })
