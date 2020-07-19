// https://github.com/AlCalzone/node-tradfri-client/

const fs = require('fs')

const {
  discoverGateway,
  TradfriClient: NodeTradfriClient,
} = require('node-tradfri-client')

const { file } = require('../utils')
const { logger } = require('../Logger')
const { messageBroker } = require('../MessageBroker')

const actionMethods = require('./actionMethods')
const listenerMethods = require('./listenerMethods')

class TradfriClient {
  tradfri = null
  gateway = null
  config = {}
  lights = {}
  groups = {}
  tpStates = {
    lights: [],
    groups: []
  }

  constructor({ logger, messageBroker }) {
    this.logger = logger
    this.messageBroker = messageBroker

    this.messageBroker.once('tpPaired', this.init.bind(this))
    this.messageBroker.on('toggleLight', this.toggleLight.bind(this))
    this.messageBroker.on('toggleGroup', this.toggleGroup.bind(this))
    this.messageBroker.once('tpClosed', this.exit.bind(this))
    this.messageBroker.once('tpErrored', this.exit.bind(this))
    this.messageBroker.once('tpDisconnected', this.exit.bind(this))
  }

  init() {
    discoverGateway()
      .then(this.discovered.bind(this))
      .catch(this.errorWhileDiscorvering.bind(this))
  }

  discovered(result) {
    if (result === null) {
      this.logger.error('No gateway found!')
      return this.exit()
    }

    this.gateway = result
    this.tradfri = new NodeTradfriClient(this.gateway.name)

    this.authenticate()
  }

  errorWhileDiscorvering(err) {
    this.logger.error('Error while searching for a gateway')
    this.logger.error(err)
    return this.exit()
  }

  exit() {
    if (this.tradfri) this.tradfri.destroy()
  }

  authenticate(force = false) {
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
    return this.exit()
  }

  connect() {
    this.tradfri
      .connect(this.config.identity, this.config.psk)
      .then(this.connected.bind(this))
      .catch(this.errorWhileConnecting.bind(this))
  }

  connected() {
    this.tradfri
      .on('device updated', this.deviceUpdated.bind(this))
      .observeDevices()

    this.tradfri
      .on('group updated', this.groupUpdated.bind(this))
      .on('scene updated', this.sceneUpdated.bind(this))
      .observeGroupsAndScenes()
  }

  errorWhileConnecting(err) {
    this.logger.error('Could not connect to gateway')
    this.logger.error(err)

    this.exit()
    // this.authenticate(true)
  }
}

const importedMethods = Object.assign({},
  actionMethods,
  listenerMethods
)
for (const name in importedMethods) {
  if (!importedMethods.hasOwnProperty(name)) continue
  TradfriClient.prototype[name] = importedMethods[name]
}

module.exports = {
  tradfriClient: new TradfriClient({ logger, messageBroker })
}
