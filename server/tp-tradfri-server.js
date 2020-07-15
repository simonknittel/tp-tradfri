const net = require('net')

let server = null

function onDisconnect() {
  console.log('Client disconnected')
}

function onConnect(c) {
  console.log('Client connected')

  c.on('end', onDisconnect)

  c.write(JSON.stringify({ my: 'server' }))
  c.pipe(c)
}

function init() {
  server = new net.createServer(onConnect)

  server.on('error', (e) => {
    console.error(e)
  })

  server.listen(12037, () => {
    console.log('TP-Tradfri listening on port ', server.address().port)
  })
}

init()
