const createClient = require('../lib/client')
const MemoryKeyStore = require('../lib/memoryKeyStore')
const { generateKeyPairSync } = require('crypto')
jest.mock('axios')

describe('routes', () => {
  let client

  beforeEach(() => {
    const clientKeys = generateKeyPairSync('rsa', {
      modulusLength: 1024,
      publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs1', format: 'pem' }
    })
    const config = {
      displayName: 'CV app',
      description: 'A CV app',
      clientId: 'mycv.work',
      operator: 'https://smoothoperator.work',
      jwksUrl: '/jwks',
      clientKeys: clientKeys,
      keyStore: new MemoryKeyStore(),
      keyOptions: { modulusLength: 1024 }
    }
    client = createClient(config)
  })
  describe('/jwks', () => {
    it('contains the client_key', async () => {
      const res = { send: jest.fn().mockName('send') }
      await client.routes.jwks({}, res)

      expect(res.send).toHaveBeenCalledWith({
        keys: [
          {
            kid: 'client_key',
            alg: 'RS256',
            kty: 'RSA',
            use: 'sig',
            e: 'AQAB',
            n: expect.any(String)
          }
        ]
      })
    })

    it('contains client_key, enc keys and sig keys', async () => {
      await client.keyProvider.generate({ use: 'enc' })
      await client.keyProvider.generate({ use: 'sig' })

      const res = { send: jest.fn().mockName('send') }
      await client.routes.jwks({}, res)

      expect(res.send).toHaveBeenCalledWith({
        keys: [
          {
            kid: 'client_key',
            alg: 'RS256',
            kty: 'RSA',
            use: 'sig',
            e: 'AQAB',
            n: expect.any(String)
          },
          {
            kid: expect.any(String),
            alg: 'RS256',
            kty: 'RSA',
            use: 'enc',
            e: 'AQAB',
            n: expect.any(String)
          },
          {
            kid: expect.any(String),
            alg: 'RS256',
            kty: 'RSA',
            use: 'sig',
            e: 'AQAB',
            n: expect.any(String)
          }
        ]
      })
    })
  })
})
