const fs = require('fs')
const { performance } = require('perf_hooks')

const { file } = require('./utils')

const {
  discoverGateway,
  TradfriClient,
  AccessoryTypes,
} = require('node-tradfri-client')

class TradfriClient {
  tradfri = null
  gateway = null
  config = {}
  lights = {}

  discover() {
    performance.mark('discover')

    discoverGateway(10000)
      .then(discovered)
      .catch(err => {
        error('Error while searching for a gateway')
        error(JSON.stringify(err))
        return exit('discover')
      })
  }

  exit(perfMark) {
    performance.mark('exit')
    performance.measure(perfMark, perfMark, 'exit')
    tradfri.destroy()
  }

  toggleLight(light, state) {
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

  parseCommandLineArguments() {
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

  connected() {
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

  connect() {
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

  authenticated(result) {
    performance.mark('authenticated')
    performance.measure('authenticate', 'authenticate', 'authenticated')

    config.identity = result.identity
    config.psk = result.psk

    fs.appendFile(file('config.txt'), `identity=${config.identity}\npsk=${config.psk}`, (err) => {
      if (err) return error('Error while saving identity and psk to config.txt')
      connect()
    })
  }

  authenticate() {
    performance.mark('authenticate')
    performance.measure('discovered', 'discovered', 'authenticate')

    fs.readFile(file('config.txt'), (err, data) => {
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

      if (config.security_code === '') return error('No security_code provided!')
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

  discovered(result) {
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
}

module.exports = {
  tardfriClient: new TradfriClient()
}
