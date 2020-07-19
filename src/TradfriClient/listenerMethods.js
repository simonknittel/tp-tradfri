const {
  AccessoryTypes,
} = require('node-tradfri-client')

const { isEqual } = require('../utils')

function deviceUpdated(device) {
  if (device.type !== AccessoryTypes.lightbulb) return
  this.lights[device.instanceId] = device

  const oldList = [...this.tpStates.lights]

  this.tpStates.lights = []

  for (const lightId in this.lights) {
    if (!this.lights.hasOwnProperty(lightId)) return
    this.tpStates.lights.push(`${this.lights[lightId].name} (${lightId})`)
  }

  // Some devices cause 'device updated' events even tho nothing happened
  if (isEqual(this.tpStates.lights, oldList)) return

  this.messageBroker.emit('deviceUpdated', this.tpStates.lights)
}

function groupUpdated(group) {
  this.groups[group.instanceId] = group

  const oldList = [...this.tpStates.groups]

  this.tpStates.groups = []

  for (const groupId in this.groups) {
    if (!this.groups.hasOwnProperty(groupId)) return
    this.tpStates.groups.push(`${this.groups[groupId].name} (${groupId})`)
  }

  // Some devices cause 'device updated' events even tho nothing happened
  if (isEqual(this.tpStates.groups, oldList)) return

  this.messageBroker.emit('groupUpdated', this.tpStates.groups)
}

function sceneUpdated(groupId, scene) {
  // console.log(sceneId, scene)
}

module.exports = {
  deviceUpdated,
  groupUpdated,
  sceneUpdated
}
