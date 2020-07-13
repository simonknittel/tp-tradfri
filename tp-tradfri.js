const fs = require('fs')
const path = require('path')

const {
  performance,
  PerformanceObserver
} = require('perf_hooks')

const {
  discoverGateway,
  TradfriClient,
  Accessory,
  AccessoryTypes,
} = require('node-tradfri-client')

let tradfri = null
let gateway = null
const config = {}
const lights = {}

function log(content) {
  const now = new Date()
  const seconds = now.getSeconds() < 10 ? '0' + now.getSeconds() : now.getSeconds()
  const minutes =  now.getMinutes() < 10 ? '0' + now.getMinutes() : now.getMinutes()
  const hours =  now.getHours() < 10 ? '0' + now.getHours() : now.getHours()
  const time = `${hours}:${minutes}:${seconds}`

  const msg = `[${time}] ${content}`

  console.log(msg)
  fs.appendFile(path.join(__dirname, 'log.txt'), msg + '\n', err => {
    if (err) console.log(err)
  })
}

function error(content) {
  log('ERROR: ' + content)
}

function exit(perfMark) {
  performance.mark('exit')
  performance.measure(perfMark, perfMark, 'exit')
  tradfri.destroy()
}

const obs = new PerformanceObserver(list => {
  const entry = list.getEntries()[0]
  log(`Time for ('${entry.name}'): ${entry.duration}`)
})
obs.observe({ entryTypes: ['measure'], buffered: false })

function toggleLight(light, state) {
  performance.mark('toggleLight')
  performance.measure('parseCommandLineArguments', 'parseCommandLineArguments', 'toggleLight')

  if (!lights[light]) {
    error('Unknown light!')
    return exit('toggleLight')
  }

  lights[light].lightList[0]
    .toggle()
    .then(() => {
      return exit('toggleLight')
    })
}

function parseCommandLineArguments() {
  performance.mark('parseCommandLineArguments')
  performance.measure('connected', 'connected', 'parseCommandLineArguments')

  switch (process.argv[2]) {
    case 'toggleLight':
      toggleLight(process.argv[3], process.argv[4])
      break

    default:
      error('Unknown command line argument!')
      return exit('parseCommandLineArguments')
  }
}

function connected() {
  performance.mark('connected')
  performance.measure('connect', 'connect', 'connected')

  tradfri
    .on('device updated', (device) => {
      if (device.type !== AccessoryTypes.lightbulb) return
      lights[device.instanceId] = device
    })
    .observeDevices()

  setTimeout(parseCommandLineArguments, 200)
}

function connect() {
  performance.mark('connect')
  performance.measure('authenticated', 'authenticated', 'connect')

  tradfri
    .connect(config.identity, config.psk)
    .then(connected)
    .catch(err => {
      error('Could not connect to gateway')
      error(JSON.stringify(err))
      return exit('connect')
    })
}

function authenticated(result) {
  performance.mark('authenticated')
  performance.measure('authenticate', 'authenticate', 'authenticated')

  config.identity = result.identity
  config.psk = result.psk

  fs.appendFile(path.join(__dirname, 'config.txt'), `identity=${config.identity}\npsk=${config.psk}`, (err) => {
    if (err) return error('Error while saving identity and psk to config.txt')
    connect()
  })
}

function authenticate() {
  performance.mark('authenticate')
  performance.measure('discovered', 'discovered', 'authenticate')

  fs.readFile(path.join(__dirname, 'config.txt'), (err, data) => {
    if (err) return error('Error while reading config.txt')

    const dataArray = data.toString().split('\n')
    dataArray.forEach(entry => {
      if (entry.trim() === '') return

      const splittedEntry = entry.split('=')
      config[splittedEntry[0].trim().toLocaleLowerCase()] = splittedEntry[1].trim()
    })

    if (config.identity && config.psk) {
      performance.mark('authenticated')
      performance.measure('authenticate', 'authenticate', 'authenticated')
      return connect()
    }

    if (config.security_code === '' ) return error('No security_code provided!')
    tradfri
      .authenticate(config.security_code)
      .then(authenticated)
      .catch(err => {
        error('Could not authenticate with gateway')
        error(JSON.stringify(err))
        return exit('authenticated')
      })
  })

}

function discovered(result) {
  performance.mark('discovered')
  performance.measure('init', 'init', 'discovered')

  if (result === null) {
    error('No gateway found!')
    return exit('No gateway found!')
  }

  gateway = result
  tradfri = new TradfriClient(gateway.name)
  authenticate()
}

function init() {
  performance.mark('init')

  discoverGateway(10000)
    .then(discovered)
    .catch(err => {
      error('Error while searching for a gateway')
      error(JSON.stringify(err))
      return exit('init')
    })
}

init()
