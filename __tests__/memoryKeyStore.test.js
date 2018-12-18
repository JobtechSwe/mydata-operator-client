const MemoryKeyStore = require('../lib/memoryKeyStore')

describe('MemoryKeyStore', () => {
  let storage
  beforeEach(() => {
    storage = new MemoryKeyStore()
  })
  it('returns keys', async () => {
    expect(await storage.load({ use: 'enc' })).toEqual([])
    expect(await storage.load({use: 'sig'})).toEqual([])
  })
  it('stores an enc key and returns it', async () => {
    const key = { use: 'enc', kid: 'enc1' }
    await storage.save(key)
    expect(await storage.load({ use: 'enc' })).toEqual([key])
  })
  it('stores a sig key and returns it', async () => {
    const key = { use: 'sig', kid: 'sig1' }
    await storage.save(key)
    expect(await storage.load({ use: 'sig' })).toEqual([key])
  })
  it('filters on use', async () => {
    const sigKey = { use: 'sig', kid: 'sig1' }
    const encKey = { use: 'enc', kid: 'enc1' }
    await storage.save(sigKey)
    await storage.save(encKey)
    expect(await storage.load({ use: 'sig' })).toEqual([sigKey])
  })
  it('filters on use and kid', async () => {
    const sigKey1 = { use: 'sig', kid: 'sig1' }
    const sigKey2 = { use: 'sig', kid: 'sig2' }
    const encKey = { use: 'enc', kid: 'enc1' }
    await storage.save(sigKey1)
    await storage.save(sigKey2)
    await storage.save(encKey)
    expect(await storage.load({ use: 'sig', kid: 'sig2' })).toEqual([sigKey2])
  })
  it('removes on kid', async () => {
    const sigKey1 = { use: 'sig', kid: 'sig1' }
    const sigKey2 = { use: 'sig', kid: 'sig2' }
    const encKey = { use: 'enc', kid: 'enc1' }
    await storage.save(sigKey1)
    await storage.save(sigKey2)
    await storage.save(encKey)
    await storage.remove('sig1')
    expect(await storage.load({ use: 'sig' })).toEqual([sigKey2])
  })
})

