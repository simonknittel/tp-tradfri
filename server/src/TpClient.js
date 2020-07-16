// https://nodejs.org/api/net.html
// http://touch-portal.com/api/

const net = require('net')
const { logger } = require('./Logger')
const { tradfriClient } = require('./TradfriClient')

class TpClient {
  TP_PORT = process.env.TP_PORT || 12136
  client = null

  constructor({ logger, tradfriClient }) {
    this.logger = logger
    this.tradfriClient = tradfriClient

    this.tpClient = new net.createConnection({ port: this.TP_PORT }, this.onConnect.bind(this))
    this.tpClient.on('error', this.onError.bind(this))
    this.tpClient.on('data', this.onData.bind(this))
    this.tpClient.on('end', this.onDisconnect.bind(this))
  }

  onConnect() {
    this.logger.log(`Connected to Touch Portal on port ${this.TP_PORT}.`)

    const json = JSON.stringify({
      type: 'pair',
      id: 'tp_tradfri'
    })

    this.tpClient.write(json + '\n')
  }

  onError(e) {
    this.logger.error(e)
    if (this.tradfriClient.tradfri) this.tradfriClient.exit()
    this.tpClient.end()
  }

  onData(data) {
    console.log('onDataaaaaaaaaaaaaaaa')

    const response = JSON.parse(data.toString())

    this.logger.log(response)

    switch (response.type) {
      case 'info':
        this.pluginPaired()
        break

      case 'closePlugin':
        if (response.pluginId !== 'tp_tradfri') break
        this.pluginClosed()
        break

      case 'action':
        if (response.pluginId !== 'tp_tradfri') break
        this.action(response)
        break
    }
  }

  onDisconnect() {
    this.logger.log('Disconnected from Touch Portal.')
  }

  pluginPaired() {
    this.logger.log('Paired with Touch Portal.')
    this.tradfriClient.init()
  }

  pluginClosed() {
    this.logger.log('Connection closed by Touch Portal.')
    if (this.tradfriClient.tradfri) this.tradfriClient.exit()
    this.tpClient.end()
  }

  action(response) {
    switch (response.actionId) {
      case 'tpt_action_01':
        const light = response.data.find(entry => entry.id === 'tpt_light_01')
        const state = response.data.find(entry => entry.id === 'tpt_light_state_01')
        this.tradfriClient.toggleLight(light, state)
        break
    }
  }
}

module.exports = {
  tpClient: new TpClient({ logger, tradfriClient })
}
