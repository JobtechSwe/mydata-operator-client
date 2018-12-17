const axios = require('axios')
const EventEmitter = require('events')
class MyEmitter extends EventEmitter {}
const myEmitter = new MyEmitter()

module.exports = {
  request: config => async consent => {
    const response = await axios.post(`${config.operator}/api/consents/requests`, consent)
    return response.data.data
  },
  notify: consent => myEmitter.emit('consent', consent),
  events: myEmitter
}
