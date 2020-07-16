const { PerformanceObserver } = require('perf_hooks')

require('./TpClient.js')

const obs = new PerformanceObserver(list => {
  const entry = list.getEntries()[0]
  log(`Time for ('${entry.name}'): ${entry.duration}`)
})
obs.observe({ entryTypes: ['measure'], buffered: false })
