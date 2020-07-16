// https://nodejs.org/api/net.html
// http://touch-portal.com/api/

const net = require('net')
const { logger } = require('./Logger')
// const { tradfriClient } = require('./TradfriClient')

class TpClient {
  TP_PORT = process.env.TP_PORT || 12136
  client = null

  constructor({ logger, tradfriClient }) {
    this.logger = logger
    // this.tradfriClient = tradfriClient

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
    // this.tradfriClient.exit()
    this.tpClient.end()
  }

  pluginPaired() {
    this.logger.log('Paired with Touch Portal.')
    // this.tradfriClient.discover()
  }

  pluginClosed() {
    this.logger.log('Connection closed by Touch Portal.')
    // this.tradfriClient.exit()
    this.tpClient.end()
  }

  action(response) {
    console.log('action()')
    console.log(response)
  }

  onData(data) {
    const response = JSON.parse(data.toString())

    this.logger.log(response)

    if (response.pluginId !== 'tp_tradfri') return

    switch (response.type) {
      case 'info':
        this.pluginPaired()
        break;

      case 'closePlugin':
        this.pluginClosed()
        break;

      case 'action':
        this.action(response)
        break;

      default:
        console.log(response)
        break;
    }
  }

  onDisconnect() {
    this.logger.log('Disconnected from Touch Portal.')
  }
}

// module.exports = {
//   tpClient: new TpClient({ logger, tradfriClient })
// }
module.exports = {
  tpClient: new TpClient({ logger })
}
