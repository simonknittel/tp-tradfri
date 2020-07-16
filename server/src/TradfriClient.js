const fs = require('fs')
const { performance } = require('perf_hooks')

const { logger } = require('./Logger')
const { file } = require('./utils')

const {
  discoverGateway,
  TradfriClient: NodeTradfriClient,
  AccessoryTypes,
} = require('node-tradfri-client')

class TradfriClient {
  tradfri = null
  gateway = null
  config = {}
  lights = {}

  constructor({ logger }) {
    this.logger = logger
  }

  init() {
    performance.mark('init')

    discoverGateway()
      .then(this.discovered.bind(this))
      .catch(this.errorWhileDiscorvering.bind(this))
  }

  discovered(result) {
    performance.mark('discovered')
    performance.measure('init', 'init', 'discovered')

    if (result === null) {
      this.logger.error('No gateway found!')
      return exit('discovered')
    }

    this.gateway = result
    this.tradfri = new NodeTradfriClient(gateway.name)
    this.authenticate()
  }

  errorWhileDiscorvering(err) {
    this.logger.error('Error while searching for a gateway')
    this.logger.error(JSON.stringify(err))
    return exit('init')
  }

  exit(perfMark) {
    performance.mark('exit')
    performance.measure(perfMark, perfMark, 'exit')
    this.tradfri.destroy()
  }

  authenticate() {
    performance.mark('authenticate')
    performance.measure('discovered', 'discovered', 'authenticate')

    fs.readFile(file('config.txt'), (err, data) => {
      if (err) return this.logger.error('Error while reading config.txt')

      const dataArray = data.toString().split('\n')
      dataArray.forEach(entry => {
        if (entry.trim() === '') return

        const splittedEntry = entry.split('=')
        this.config[splittedEntry[0].trim().toLocaleLowerCase()] = splittedEntry[1].trim()
      })

      if (this.config.identity && this.config.psk) {
        performance.mark('authenticated')
        performance.measure('authenticate', 'authenticate', 'authenticated')
        return this.connect()
      }

      if (this.config.security_code === '') return this.logger.error('No security_code provided!')
      tradfri
        .authenticate(this.config.security_code)
        .then(this.authenticated.bind(this))
        .catch(this.errorWhileAuthenticating.bind(this))
    })
  }

  authenticated(result) {
    performance.mark('authenticated')
    performance.measure('authenticate', 'authenticate', 'authenticated')

    this.config.identity = result.identity
    this.config.psk = result.psk

    fs.appendFile(
      file('config.txt'),
      `identity=${this.config.identity}\npsk=${this.config.psk}`,
      (err) => {
        if (err) return this.logger.error('Error while saving identity and psk to config.txt')
        this.connect()
      }
    )
  }

  errorWhileAuthenticating(err) {
    this.logger.error('Could not authenticate with gateway')
    this.logger.error(JSON.stringify(err))
    return this.exit('authenticated')
  }

  connect() {
    performance.mark('connect')
    performance.measure('authenticated', 'authenticated', 'connect')

    tradfri
      .connect(this.config.identity, this.config.psk)
      .then(this.connected.bind(this))
      .catch(this.errorWhileConnecting.bind(this))
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

    // TODO: Update Touch Portal
  }

  errorWhileConnecting(err) {
    this.logger.error('Could not connect to gateway')
    this.logger.error(JSON.stringify(err))
    return this.exit('connect')
  }

  toggleLight(light, state = 'Toggle') {
    performance.mark('toggleLight')

    if (!lights[light]) {
      this.logger.error('Unknown light!')
      return exit('toggleLight')
    }

    switch (state) {
      case 'On':
        lights[light].lightList[0]
          .turnOn()
          .then(() => {
            this.logger.log(light, state)
            return exit('toggleLight')
          })
        break;

      case 'Off':
        lights[light].lightList[0]
          .turnOff()
          .then(() => {
            this.logger.log(light, state)
            return exit('toggleLight')
          })
        break;

      default:
        lights[light].lightList[0]
          .toggle()
          .then(() => {
            this.logger.log(light, state)
            return exit('toggleLight')
          })
        break;
    }
  }
}

module.exports = {
  tradfriClient: new TradfriClient({ logger })
}
