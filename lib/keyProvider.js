const { generateKeyPair } = require('crypto')
const { promisify } = require('util')
const moment = require('moment')
const { serialize } = require('jwks-provider')

const defaults = {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs1', format: 'pem' }
}

module.exports = class KeyProvider {
  constructor (clientKeys, keyStore, options = {}) {
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
    this.generateTemp = this.generateTemp.bind(this)
    this.remove = this.remove.bind(this)
    this.removeTemp = this.removeTemp.bind(this)
    this.jwksKeyList = this.jwksKeyList.bind(this)
    this.jwksKey = this.jwksKey.bind(this)
  }
  generateKid (use) {
    return `${use}_${moment.utc().format('YYYYMMDDHHmmss')}`
  }
  async getKeys ({ use }) {
    return this.keyStore.load({ use })
  }
  async getKey ({ use, kid }) {
    if (use === 'sig' && kid === 'client_key') {
      return this.clientKeys
    }
    const keys = await this.keyStore.load({ use, kid })
    return keys[0]
  }
  async generateKey ({ use, kid }) {
    kid = kid || this.generateKid(use)
    const { publicKey, privateKey } = await promisify(generateKeyPair)('rsa', {
      modulusLength: this.options.modulusLength,
      publicKeyEncoding: this.options.publicKeyEncoding,
      privateKeyEncoding: this.options.privateKeyEncoding
    })
    return {
      publicKey,
      privateKey,
      use,
      kid
    }
  }
  async generate ({ use, kid }) {
    const key = await this.generateKey({ use, kid })
    await this.keyStore.save(key)
    return key
  }
  async generateTemp ({ use, kid }, ttl) {
    const key = await this.generateKey({ use, kid })
    await this.keyStore.saveTemp(key, ttl)
    return key
  }
  async remove (kid) {
    await this.keyStore.remove(kid)
  }
  async removeTemp (kid) {
    await this.keyStore.removeTemp(kid)
  }
  async jwksKeyList () {
    const encKeys = await this.keyStore.load({ use: 'enc' })
    const sigKeys = await this.keyStore.load({ use: 'sig' })

    return serialize([this.clientKeys, ...encKeys, ...sigKeys])
  }
  async jwksKey (kid) {
    const keys = await this.keyStore.load({ kid })

    return serialize(keys).keys[0]
  }
}
