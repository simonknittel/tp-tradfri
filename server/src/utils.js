const path = require('path')

function file(filename) {
  return path.join(path.dirname(process.execPath), filename)
}

module.exports = {
  file
}
