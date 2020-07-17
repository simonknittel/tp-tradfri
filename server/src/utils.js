const path = require('path')

const throttle = require('lodash/throttle')

function file(filename) {
  return path.join(path.dirname(process.execPath), filename)
}

module.exports = {
  file,
  throttle
}
