// https://nodejs.org/api/net.html
// http://touch-portal.com/api/

const net = require('net')
const { throttle } = require('./utils')
const { logger } = require('./Logger')
const { messageBroker } = require('./MessageBroker')

class TpClient {
  TP_PORT = process.env.TP_PORT || 12136
  client = null

  constructor({ logger, messageBroker }) {
    this.logger = logger
    this.messageBroker = messageBroker

    this.messageBroker.on('deviceUpdated', throttle(this.updateLightsState.bind(this), 500))
    this.messageBroker.on('groupUpdated', throttle(this.updateGroupsState.bind(this), 500))

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
    this.messageBroker.emit('tpErrored')
    this.tpClient.end()
  }

  onData(data) {
    const response = JSON.parse(data.toString())
    this.logger.log('onData')
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
    this.messageBroker.emit('tpDisconnected')
    this.tpClient.end()
  }

  pluginPaired() {
    this.logger.log('Paired with Touch Portal.')
    this.messageBroker.emit('tpPaired')
  }

  pluginClosed() {
    this.logger.log('Connection closed by Touch Portal.')
    this.messageBroker.emit('tpClosed')
    this.tpClient.end()
    // TODO: Doesn't exit the process yet
  }

  action(response) {
    if (response.actionId === 'tpt_action_01') {
      const params = {
        light: response.data.find(entry => entry.id === 'tpt_light_01').value,
        state: response.data.find(entry => entry.id === 'tpt_light_state_01').value,
      }

      const brightness = response.data.find(entry => entry.id === 'tpt_light_brightness_01')
      const color = response.data.find(entry => entry.id === 'tpt_light_color_01')
      if (brightness.value) params.brightness = brightness.value
      if (color.value) params.color = color.value

      this.messageBroker.emit('toggleLight', params)

    } else if (response.actionId === 'tpt_action_02') {
      const params = {
        group: response.data.find(entry => entry.id === 'tpt_group_01').value,
        state: response.data.find(entry => entry.id === 'tpt_group_state_01').value,
      }

      const brightness = response.data.find(entry => entry.id === 'tpt_group_brightness_01')
      if (brightness.value) params.brightness = brightness.value

      this.messageBroker.emit('toggleGroup', params)
    }
  }

  updateLightsState(lights) {
    const json = JSON.stringify({
      type: "choiceUpdate",
      id: "tpt_light_01",
      value: lights
    })

    this.tpClient.write(json + '\n')
  }

  updateGroupsState(groups) {
    const json = JSON.stringify({
      type: "choiceUpdate",
      id: "tpt_group_01",
      value: groups
    })

    this.tpClient.write(json + '\n')
  }
}

module.exports = {
  tpClient: new TpClient({ logger, messageBroker })
}
