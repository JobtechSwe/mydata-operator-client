const expiry = {}

function setExpiry (self, kid, ttl) {
  clearTimeout(expiry[kid])
  if (typeof ttl === 'number') {
    expiry[kid] = setTimeout(() => self.removeKey(kid), ttl)
  }
}

class MemoryKeyStore {
  constructor () {
    this.keys = []
    this.tempKeys = []
    this.timeouts = {}
    this.getKey = this.getKey.bind(this)
    this.getKeys = this.getKeys.bind(this)
    this.saveKey = this.saveKey.bind(this)
    this.removeKey = this.removeKey.bind(this)
    this.updateTTL = this.updateTTL.bind(this)
  }
  async getKey (kid) {
    let result = this.keys.concat(this.tempKeys).filter(key => key.kid === kid)
    return result.length ? result[0] : null
  }
  async getKeys (use) {
    return this.keys.filter(key => key.use === use)
  }
  async saveKey (key, ttl) {
    this.keys.push(key)
    if (ttl) {
      setExpiry(this, key.kid, ttl)
    }
    return key
  }
  async removeKey (kid) {
    this.keys = this.keys.filter(key => key.kid !== kid)
  }
  async updateTTL (kid, ttl) {
    setExpiry(this, kid, ttl)
  }
}
module.exports = MemoryKeyStore
