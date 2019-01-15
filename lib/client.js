const axios = require('axios')
const { createSign } = require('crypto')
const routes = require('./routes')
const consents = require('./consents')
const KeyProvider = require('./keyProvider')
const { EventEmitter } = require('events')

class Client {
  constructor (config) {
    this.config = config
    this.keyProvider = new KeyProvider(config.clientKeys, config.keyStore, config.keyOptions)
    this.routes = routes(this)
    this.consents = consents(this)
    this.events = new EventEmitter()

    this.connect = this.connect.bind(this)
    this.sign = this.sign.bind(this)

    this.events.on('CONSENT_APPROVED', this.onConsentApproved.bind(this))
  }
  async sign (data, kid) {
    const keyPair = await this.keyProvider.getKey({ use: 'sig', kid })
    kid = keyPair.kid

    return {
      kid,
      data: createSign('RSA-SHA256')
        .update(JSON.stringify(data))
        .sign(keyPair.privateKey, 'base64')
    }
  }

  async onConsentApproved (payload) {
    await this.keyProvider.remove(payload.kid)

    // TODO: Store encryption keys for consents in KeyStore
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
    this.events.emit('CONNECTED', result)
  }
}

function create (config) {
  const client = new Client(config)
  return client
}

module.exports = create
