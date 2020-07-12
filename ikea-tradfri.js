const {
  discoverGateway,
  TradfriClient,
  Accessory,
  AccessoryTypes,
} = require('node-tradfri-client')

let tradfri = null
let gateway = null
let identity = null
let psk = null
const lights = {}

process.on('beforeExit', () => {
  tradfri.destroy()
})

function toggleLight(light, state) {
  // console.log('toggleLight', light, state)

  lights[light].lightList[0]
    .toggle()
    .then(() => {
      // console.log('Light toggled')
      process.exit()
    })
}

function parseCommandLineArguments() {
  // console.log(lights)
  // console.log(process.argv)

  tradfri.stopObservingDevices()

  switch (process.argv[2]) {
    case 'toggleLight':
      toggleLight(process.argv[3], process.argv[4])
      break

    default:
    console.error('Unknown command line argument!')
      break
  }
}

function connected() {
  // console.log('Connected to gateway')

  tradfri
    .on('device updated', (device) => {
      if (device.type !== AccessoryTypes.lightbulb) return
      lights[device.instanceId] = device
    })
    .observeDevices()

  setTimeout(parseCommandLineArguments, 200)
}

function connect() {
  tradfri
    .connect(identity, psk)
    .then(connected)
    .catch(err => {
      console.error('Could not connect to gateway')
      console.error(err)
    })
}

function authenticate() {
  tradfri
    .authenticate('UuHgS85WjOxMA2kH')
    .then(result => {
      // console.log('Authenticated')
      identity = result.identity
      psk = result.psk
      connect()
    })
    .catch(err => {
      console.error('Could not authenticate with gateway')
      console.error(err)
    })
}

function discovered(result) {
  // console.log('Found gateway:')
  // console.log(result)

  if (result === null) {
    console.error('No gateway found!')
    return
  }

  gateway = result
  tradfri = new TradfriClient(gateway.name)
  authenticate()
}

function init() {
  discoverGateway(10000)
    .then(discovered)
    .catch(err => {
      console.error('Error while searching for a gateway')
      console.error(err)
    })
}

init()
