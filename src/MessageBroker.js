const EventEmitter = require('events')

class MessageBroker extends EventEmitter {}

module.exports = {
  messageBroker: new MessageBroker()
}
