const create = require(`${process.cwd()}/lib/client`)
const axios = require('axios')
const { generateKeyPairSync, createVerify } = require('crypto')
jest.mock('axios')

describe('client', () => {
  let config, keys

  beforeEach(() => {
    keys = {
      client: generateKeyPairSync('rsa', {
        modulusLength: 1024,
        publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs1', format: 'pem' }
      }),
      sign: generateKeyPairSync('rsa', {
        modulusLength: 1024,
        publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs1', format: 'pem' }
      }),
      encrypt: generateKeyPairSync('rsa', {
        modulusLength: 1024,
        publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs1', format: 'pem' }
      })
    }
    config = {
      displayName: 'CV app',
      description: 'A CV app',
      clientId: 'mycv.work',
      operator: 'https://smoothoperator.work',
      jwksUrl: '/jwks',
      clientKeys: keys.client,
      signKeyProvider: async () => {
        return [{ kid: 'sign', key: keys.sign.publicKey }]
      },
      encryptKeyProvider: async () => {
        return [{ kid: 'encrypt', key: keys.encrypt.publicKey }]
      }
    }
  })
  afterEach(() => {
    axios.post.mockClear()
  })

  describe('create', () => {
    it('calls the operator to register the client service', () => {
      create(config)
      expect(axios.post).toHaveBeenCalledWith('https://smoothoperator.work/api/clients', expect.any(Object))
    })
    it('sends correct parameters', () => {
      create(config)
      expect(axios.post).toHaveBeenCalledWith(expect.any(String), {
        data: {
          displayName: 'CV app',
          description: 'A CV app',
          clientId: 'mycv.work',
          jwksUrl: '/jwks'
        },
        signature: expect.any(String)
      })
    })
    it('signs the payload', () => {
      create(config)
      const [, { data, signature }] = axios.post.mock.calls[0]
      const verified = createVerify('RSA-SHA256')
        .update(JSON.stringify(data))
        .verify(keys.client.publicKey, signature, 'base64')

      expect(verified).toEqual(true)
    })
  })
  describe('/jwks', () => {
    it('contains the client_key', async () => {
      const client = create(config)
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
          }/* ,
          {
            kid: 'sign',
            alg: 'RS256',
            kty: 'RSA',
            use: 'sig',
            e: 'AQAB',
            n: expect.any(String)
          },
          {
            kid: 'encrypt',
            alg: 'RS256',
            kty: 'RSA',
            use: 'enc',
            e: 'AQAB',
            n: expect.any(String)
          } */
        ]
      })
    })
  })
})
