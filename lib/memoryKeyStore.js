module.exports = class MemoryKeyStore {
  constructor () {
    this.keys = []
    this.tempKeys = []
    this.timeouts = {}
    this.load = this.load.bind(this)
    this.save = this.save.bind(this)
    this.saveTemp = this.saveTemp.bind(this)
    this.remove = this.remove.bind(this)
    this.removeTemp = this.removeTemp.bind(this)
  }
  async load ({ use, kid }) {
    let result = this.keys.concat(this.tempKeys)
    if (use) {
      result = result.filter(key => key.use === use)
    }
    if (kid) {
      result = result.filter(key => key.kid === kid)
    }
    return result
  }
  async save (key) {
    this.keys.push(key)
    return key
  }
  async saveTemp (key, ttl) {
    this.tempKeys.push(key)
    this.timeouts[key.kid] = setTimeout(() => this.removeTemp(key.kid), ttl)
  }
  async remove (kid) {
    this.keys = this.keys.filter(key => key.kid !== kid)
  }
  async removeTemp (kid) {
    clearTimeout(this.timeouts[kid])
    this.timeouts[kid] = undefined
    this.tempKeys = this.tempKeys.filter(key => key.kid !== kid)
  }
}
