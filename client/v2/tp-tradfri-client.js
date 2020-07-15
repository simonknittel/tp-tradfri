const net = require('net')

let client = null

function onDisconnect() {
  console.log('Disconnected from server')
}

function onData(data) {
  console.log(data.toString())
  client.end()
}

function onConnect(c) {
  console.log('Connected to server')

  client.write(JSON.stringify({ foo: 'bar' }))
}

function init() {
  client = new net.createConnection({ port: 12037 }, onConnect)

  client.on('data', onData)

  client.on('end', onDisconnect)
}

init()
