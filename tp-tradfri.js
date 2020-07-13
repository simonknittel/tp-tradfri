const fs = require('fs')

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

process.on('exit', () => {
  performance.mark('exit')
  performance.measure('toggleLight', 'toggleLight', 'exit')

  tradfri.destroy()
})

const obs = new PerformanceObserver(list => {
  const entry = list.getEntries()[0]
  console.log(`Time for ('${entry.name}')`, entry.duration)
})
obs.observe({ entryTypes: ['measure'], buffered: false })

function toggleLight(light, state) {
  performance.mark('toggleLight')
  performance.measure('parseCommandLineArguments', 'parseCommandLineArguments', 'toggleLight')

  if (!lights[light]) {
    console.error('Unknown light!')
    process.exit()
  }

  lights[light].lightList[0]
    .toggle()
    .then(() => {
      process.exit()
    })
}

function parseCommandLineArguments() {
  performance.mark('parseCommandLineArguments')
  performance.measure('connected', 'connected', 'parseCommandLineArguments')

  tradfri.stopObservingDevices()

  switch (process.argv[2]) {
    case 'toggleLight':
      toggleLight(process.argv[3], process.argv[4])
      break

    default:
      console.error('Unknown command line argument!')
      process.exit()
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
      console.error('Could not connect to gateway')
      console.error(err)
    })
}

function authenticated(result) {
  performance.mark('authenticated')
  performance.measure('authenticate', 'authenticate', 'authenticated')

  config.identity = result.identity
  config.psk = result.psk

  fs.appendFile('config.txt', `identity=${config.identity}\npsk=${config.psk}`, (err) => {
    if (err) return console.error('Error while saving identity and psk to config.txt')
    connect()
  })
}

function authenticate() {
  performance.mark('authenticate')
  performance.measure('discovered', 'discovered', 'authenticate')

  fs.readFile('config.txt', (err, data) => {
    if (err) return console.error('Error while reading config.txt')

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

    if (config.security_code === '' ) return console.error('No security_code provided!')
    tradfri
      .authenticate(config.security_code)
      .then(authenticated)
      .catch(err => {
        console.error('Could not authenticate with gateway')
        console.error(err)
      })
  })

}

function discovered(result) {
  performance.mark('discovered')
  performance.measure('init', 'init', 'discovered')

  if (result === null) {
    console.error('No gateway found!')
    return
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
      console.error('Error while searching for a gateway')
      console.error(err)
    })
}

init()
