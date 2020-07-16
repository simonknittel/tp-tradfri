// https://nodejs.org/api/net.html

const net = require('net')
const { logger } = require('./Logger')

class TcpServer {
  PORT = process.env.PORT || 12037
  server = null

  constructor({ logger }) {
    this.logger = logger

    this.server = new net.createServer(this.onConnect.bind(this))
    this.server.on('error', this.onError.bind(this))
    this.server.listen(this.PORT, this.onListen.bind(this))
  }

  onDisconnect() {
    this.logger.log('Client disconnected')
  }

  onError(e) {
    if (e.code === 'ECONNRESET') return
    this.logger.error(e)
  }

  onData(data) {
    this.logger.log(JSON.parse(data))
  }

  onConnect(socket) {
    this.logger.log('Client connected')
    socket.on('error', this.onError)

    socket.setEncoding('utf8')

    socket.on('data', this.onData)
    socket.on('end', this.onDisconnect)

    socket.write(JSON.stringify({ my: 'server' }))
    socket.pipe(socket)
  }

  onListen() {
    this.logger.log(
      'TP-Tradfri listening on port ',
      this.server.address().port
    )
  }
}

module.exports = {
  tcpServer: new TcpServer({ logger })
}
