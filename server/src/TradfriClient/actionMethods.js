function toggleLight({ light, state, brightness, color }) {
  const re = /\(.*\)$/

  light = re.exec(light)[0]
  light = light.replace('(', '')
  light = light.replace(')', '')

  if (!this.lights[light]) {
    this.logger.error('Unknown light!')
    return this.exit()
  }

  if (brightness) brightness = parseInt(brightness.replace('%', ''))
  if (color) color = color.replace('#', '').substr(0, 6)

  switch (state) {
    case 'On':
      this.tradfri
        .operateLight(this.lights[light], {
          onOff: true,
          dimmer: brightness,
          color: color,
        }, true)
        .then(() => {
          this.logger.log(`toggleLight: ${light}, ${state}, ${brightness}, ${color}`)
        })
      break;

    case 'Off':
      this.lights[light].lightList[0]
        .turnOff()
        .then(() => {
          this.logger.log(`toggleLight: ${light}, ${state}, ${brightness}, ${color}`)
        })
      break;

    default:
      this.lights[light].lightList[0]
        .toggle()
        .then(() => {
          this.logger.log(`toggleLight: ${light}, ${state}, ${brightness}, ${color}`)
        })
      break;
  }
}

function toggleGroup({ group, state }) {
  const re = /\(.*\)$/

  group = re.exec(group)[0]
  group = group.replace('(', '')
  group = group.replace(')', '')

  if (!this.groups[group]) {
    this.logger.error('Unknown group!')
    return this.exit()
  }

  switch (state) {
    case 'On':
      this.groups[group]
        .turnOn()
        .then(() => {
          this.logger.log(`toggleGroup: ${group}, ${state}`)
        })
      break;

    case 'Off':
      this.groups[group]
        .turnOff()
        .then(() => {
          this.logger.log(`toggleGroup: ${group}, ${state}`)
        })
      break;
  }
}

module.exports = {
  toggleLight,
  toggleGroup
}
