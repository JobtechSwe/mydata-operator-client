const axios = require('axios')
const { createSign } = require('crypto')
const { events } = require('./events')
const routes = require('./routes')
const consents = require('./consents')
const KeyProvider = require('./keyProvider')
const { EventEmitter } = require('events')

const defaults = {
  jwksUrl: '/jwks',
  eventsUrl: '/events',
  alg: 'RSA-SHA512'
}

class Client extends EventEmitter {
  constructor (config) {
    super()

    this.config = {
      ...defaults,
      ...config
    }
    this.keyProvider = new KeyProvider(config.clientKeys, config.keyStore, config.keyOptions)
    this.routes = routes(this)
    this.consents = consents(this)
    this.events = events

    this.connect = this.connect.bind(this)
    this.sign = this.sign.bind(this)
  }
  async sign (data, kid) {
    const keyPair = await this.keyProvider.getKey({ use: 'sig', kid })
    kid = keyPair.kid

    return {
      kid,
      alg: this.config.alg,
      data: createSign(this.config.alg)
        .update(JSON.stringify(data))
        .sign(keyPair.privateKey, 'base64')
    }
  }
  async connect () {
    const {
      operator, displayName, description, clientId, jwksUrl, eventsUrl, unsafe
    } = this.config
    const data = { displayName, description, clientId, jwksUrl, eventsUrl }
    if (unsafe) {
      data.unsafe = unsafe
    }
    const signature = await this.sign(data, 'client_key')
    const result = await axios.post(`${operator}/api/clients`, { data, signature })
    this.emit('connect', result)
  }
}

function create (config) {
  const client = new Client(config)
  return client
}

module.exports = create
