const fs = require('fs')
const { performance } = require('perf_hooks')

const {
  discoverGateway,
  TradfriClient: NodeTradfriClient,
  AccessoryTypes,
} = require('node-tradfri-client')

const { file, isEqual } = require('./utils')
const { logger } = require('./Logger')
const { messageBroker } = require('./MessageBroker')

class TradfriClient {
  tradfri = null
  gateway = null
  config = {}
  lights = {}
  tpStates = {
    lights: []
  }

  constructor({ logger, messageBroker }) {
    this.logger = logger
    this.messageBroker = messageBroker

    this.messageBroker.once('tpPaired', this.init.bind(this))
    this.messageBroker.on('toggleLight', this.toggleLight.bind(this))
    this.messageBroker.once('tpClosed', this.exit.bind(this))
    this.messageBroker.once('tpErrored', this.exit.bind(this))
    this.messageBroker.once('tpDisconnected', this.exit.bind(this))
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
      return this.exit('discovered')
    }

    this.gateway = result
    this.tradfri = new NodeTradfriClient(this.gateway.name)

    this.authenticate()
  }

  errorWhileDiscorvering(err) {
    this.logger.error('Error while searching for a gateway')
    this.logger.error(err)
    return this.exit('init')
  }

  exit(perfMark) {
    performance.mark('exit')
    performance.measure(perfMark, perfMark, 'exit')
    if (this.tradfri) this.tradfri.destroy()
  }

  authenticate(force = false) {
    performance.mark('authenticate')
    performance.measure('discovered', 'discovered', 'authenticate')

    fs.readFile(file('config.txt'), (err, data) => {
      if (err) {
        this.logger.error('Error while reading config.txt')
        this.logger.error(err)
        return
      }

      const dataArray = data.toString().split('\n')
      dataArray.forEach(entry => {
        if (entry.trim() === '') return

        const splittedEntry = entry.split('=')
        this.config[splittedEntry[0].trim().toLocaleLowerCase()] = splittedEntry[1].trim()
      })

      if (
        force === false
        && this.config.identity
        && this.config.psk
      ) {
        performance.mark('authenticated')
        performance.measure('authenticate', 'authenticate', 'authenticated')
        return this.connect()
      }

      if (this.config.security_code === '') return this.logger.error('No security_code provided!')
      this.tradfri
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
    this.logger.error(err)
    return this.exit('authenticated')
  }

  connect() {
    performance.mark('connect')
    performance.measure('authenticated', 'authenticated', 'connect')

    this.tradfri
      .connect(this.config.identity, this.config.psk)
      .then(this.connected.bind(this))
      .catch(this.errorWhileConnecting.bind(this))
  }

  connected() {
    performance.mark('connected')
    performance.measure('connect', 'connect', 'connected')

    this.tradfri
      .on('device updated', this.deviceUpdated.bind(this))
      .observeDevices()
  }

  errorWhileConnecting(err) {
    this.logger.error('Could not connect to gateway')
    this.logger.error(err)

    this.exit()
    // this.authenticate(true)
  }

  deviceUpdated(device) {
    if (device.type !== AccessoryTypes.lightbulb) return
    this.lights[device.instanceId] = device

    const oldList = [...this.tpStates.lights]

    this.tpStates.lights = []

    for (const light in this.lights) {
      if (this.lights.hasOwnProperty(light)) {
        this.tpStates.lights.push(`${this.lights[light].name} (${light})`)
      }
    }

    // Some devices cause 'device updated' events even tho nothing happened
    if (isEqual(this.tpStates.lights, oldList)) return

    this.messageBroker.emit('deviceUpdated', this.tpStates.lights)
  }

  toggleLight({ light, state }) {
    performance.mark('toggleLight')

    if (!this.lights[light]) {
      this.logger.error('Unknown light!')
      return this.exit('toggleLight')
    }

    switch (state) {
      case 'On':
        this.lights[light].lightList[0]
          .turnOn()
          .then(() => {
            this.logger.log(`Light ${light} turned on.`)
          })
        break;

      case 'Off':
        this.lights[light].lightList[0]
          .turnOff()
          .then(() => {
            this.logger.log(`Light ${light} turned off.`)
          })
        break;

      default:
        this.lights[light].lightList[0]
          .toggle()
          .then(() => {
            this.logger.log(`Light ${light} toggled.`)
          })
        break;
    }
  }
}

module.exports = {
  tradfriClient: new TradfriClient({ logger, messageBroker })
}
