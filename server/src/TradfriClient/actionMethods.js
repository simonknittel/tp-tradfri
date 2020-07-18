function toggleLight({ light, state }) {
  const re = /\(.*\)$/

  light = re.exec(light)[0]
  light = light.replace('(', '')
  light = light.replace(')', '')

  if (!this.lights[light]) {
    this.logger.error('Unknown light!')
    return this.exit()
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

module.exports = {
  toggleLight
}
