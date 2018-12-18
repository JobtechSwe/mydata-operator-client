const { generateKeyPair } = require('crypto')
const { promisify } = require('util')
const moment = require('moment')
const NodeRSA = require('node-rsa')

const defaults = {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs1', format: 'pem' }
}

module.exports = class KeyProvider {
  constructor(clientKeys, keyStore, options = {}) {
    this.clientKeys = {
      use: 'sig',
      kid: 'client_key',
      publicKey: clientKeys.publicKey,
      privateKey: clientKeys.privateKey
    }
    this.options = Object.assign({}, defaults, options)
    this.keyStore = keyStore

    this.getKeys = this.getKeys.bind(this)
    this.getKey = this.getKey.bind(this)
    this.generate = this.generate.bind(this)
    this.remove = this.remove.bind(this)
    this.jwks = this.jwks.bind(this)
  }
  generateKid(use) {
    return `${use}_${moment.utc().format('YYYYMMDDHHmmss')}`
  }
  serialize({kid, use, publicKey}) {
    const { keyPair: { e, n } } = new NodeRSA(publicKey)
    const bufE = Buffer.alloc(4)
    bufE.writeInt32BE(e)
    const strE = bufE.slice(1).toString('base64')
    const strN = n.toBuffer().toString('base64')

    const serialized = {
      kid,
      use,
      alg: 'RS256',
      kty: 'RSA',
      n: strN,
      e: strE
    }
    return serialized
  }
  async getKeys({use}) {
    return await this.keyStore.load({use})
  }
  async getKey({use, kid}) {
    if (use === 'sig' && kid === 'client_key') {
      return this.clientKeys
    }
    const keys = await this.keyStore.load({ use, kid})
    return keys[0]
  }
  async generate({use}) {
    const {publicKey, privateKey} = await promisify(generateKeyPair)('rsa', {
      modulusLength: this.options.modulusLength,
      publicKeyEncoding: this.options.publicKeyEncoding,
      privateKeyEncoding: this.options.privateKeyEncoding
    })
    const keys = {
      publicKey,
      privateKey,
      use,
      kid: this.generateKid(use)
    }
    await this.keyStore.save(keys)
    return keys
  }
  async remove(kid) {
    await this.keyStore.remove(kid)
  }
  async jwks() {
    const encKeys = await this.keyStore.load({ use: 'enc' })
    const sigKeys = await this.keyStore.load({use: 'sig'})
    return {
      keys: [
        this.serialize(this.clientKeys),
        ...encKeys.map(keyPair => this.serialize(keyPair)),
        ...sigKeys.map(keyPair => this.serialize(keyPair))
      ]
    }
  }
}
