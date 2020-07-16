const fs = require('fs')
const { file } = require('./utils')

class Logger {
  log(content, prefix = '') {
    const now = new Date()
    const seconds = now.getSeconds() < 10 ? '0' + now.getSeconds() : now.getSeconds()
    const minutes =  now.getMinutes() < 10 ? '0' + now.getMinutes() : now.getMinutes()
    const hours =  now.getHours() < 10 ? '0' + now.getHours() : now.getHours()
    const time = `${hours}:${minutes}:${seconds}`

    const msg = `[${time}] ${prefix}${JSON.stringify(content)}`

    console.log(msg)
    /**
     * TODO: Issue with too fast write requests after each other (some log
     * messages don't appear in the correct order)
     */
    fs.appendFile(file('log.txt'), msg + '\n', err => {
      if (err) console.log(err)
    })
  }

  error(content) {
    this.log(content, 'ERROR: ')
  }
}

module.exports = {
  logger: new Logger()
}
