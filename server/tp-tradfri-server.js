// https://nodejs.org/api/net.html
// http://touch-portal.com/api/

const net = require('net')

let server = null

function onDisconnect() {
  console.log('Client disconnected')
}

function onError(e) {
  if (e.code === 'ECONNRESET') return
  console.error(e)
}

function onData(data) {
  console.log(JSON.parse(data))
}

function onConnect(socket) {
  console.log('Client connected')
  socket.on('error', onError)

  socket.setEncoding('utf8')

  socket.on('data', onData)
  socket.on('end', onDisconnect)

  socket.write(JSON.stringify({ my: 'server' }))
  socket.pipe(socket)
}

function init() {
  server = new net.createServer(onConnect)

  server.on('error', onError)

  server.listen(12037, () => {
    console.log('TP-Tradfri listening on port ', server.address().port)
  })
}

init()
