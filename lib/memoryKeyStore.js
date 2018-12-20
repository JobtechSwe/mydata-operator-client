module.exports = class MemoryKeyStore {
  constructor () {
    this.keys = []
    this.load = this.load.bind(this)
    this.save = this.save.bind(this)
    this.remove = this.remove.bind(this)
  }
  async load ({ use, kid }) {
    let result = this.keys
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
  async remove (kid) {
    this.keys = this.keys.filter(key => key.kid !== kid)
  }
}
