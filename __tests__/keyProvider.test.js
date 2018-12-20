const { generateKeyPairSync } = require('crypto')
const KeyProvider = require(`${process.cwd()}/lib/keyProvider`)

describe('KeyProvider', () => {
  let keyProvider, clientKeys, keyStore
  beforeEach(() => {
    clientKeys = generateKeyPairSync('rsa', {
      modulusLength: 1024,
      publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs1', format: 'pem' }
    })
    keyStore = {
      load: jest.fn().mockName('load').mockResolvedValue([]),
      save: jest.fn().mockName('save').mockResolvedValue({}),
      remove: jest.fn().mockName('save').mockResolvedValue()
    }
    keyProvider = new KeyProvider(clientKeys, keyStore, { modulusLength: 1024 })
  })
  describe('#getKeys', () => {
    it('calls load with type', async () => {
      await keyProvider.getKeys({ use: 'enc' })
      expect(keyStore.load).toHaveBeenCalledWith({ use: 'enc' })
    })
    it('returns all keys', async () => {
      keyStore.load.mockResolvedValue([{ kid: 'abc' }])
      const result = await keyProvider.getKeys({ use: 'enc' })
      expect(result).toEqual([{ kid: 'abc' }])
    })
  })
  describe('#getKey', () => {
    it('calls load with use and kid', async () => {
      await keyProvider.getKey({ use: 'enc', kid: 'abc' })
      expect(keyStore.load).toHaveBeenCalledWith({ use: 'enc', kid: 'abc' })
    })
    it('returns one key', async () => {
      keyStore.load.mockResolvedValue([{ kid: 'abc' }])
      const result = await keyProvider.getKey({ use: 'enc', kid: 'abc' })
      expect(result).toEqual({ kid: 'abc' })
    })
  })
  describe('#generate', () => {
    it('saves generated keys', async () => {
      await keyProvider.generate({ use: 'enc' })
      expect(keyStore.save).toHaveBeenCalledWith({
        publicKey: expect.any(String),
        privateKey: expect.any(String),
        use: 'enc',
        kid: expect.any(String)
      })
    })
    it('returns the generated keys', async () => {
      const result = await keyProvider.generate({ use: 'enc' })
      expect(result).toEqual({
        publicKey: expect.any(String),
        privateKey: expect.any(String),
        use: 'enc',
        kid: expect.any(String)
      })
    })
  })
  describe('#remove', () => {
    it('removes the key with the specified kid', async () => {
      await keyProvider.remove('abcd')
      expect(keyStore.remove).toHaveBeenCalledWith('abcd')
    })
  })
  describe('#jwks', () => {
    it('returns a jwks formatted list of all keys', async () => {
      const enc = await keyProvider.generate({ use: 'enc' })
      const sig = await keyProvider.generate({ use: 'sig' })

      keyStore.load.mockResolvedValueOnce([enc])
      keyStore.load.mockResolvedValueOnce([sig])

      const result = await keyProvider.jwks()
      expect(result).toEqual({
        keys: [
          {
            kid: 'client_key',
            use: 'sig',
            alg: 'RS256',
            kty: 'RSA',
            n: expect.any(String),
            e: 'AQAB'
          },
          {
            kid: expect.any(String),
            use: 'enc',
            alg: 'RS256',
            kty: 'RSA',
            n: expect.any(String),
            e: 'AQAB'
          },
          {
            kid: expect.any(String),
            use: 'sig',
            alg: 'RS256',
            kty: 'RSA',
            n: expect.any(String),
            e: 'AQAB'
          }
        ]
      })
    })
  })
})
