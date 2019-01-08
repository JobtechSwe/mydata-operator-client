const createClient = require('../lib/client')
const MemoryKeyStore = require('../lib/memoryKeyStore')
const axios = require('axios')
const { generateKeyPairSync, createVerify } = require('crypto')
jest.mock('axios')

describe('client', () => {
  let config, clientKeys

  beforeEach(() => {
    clientKeys = generateKeyPairSync('rsa', {
      modulusLength: 1024,
      publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs1', format: 'pem' }
    })
    config = {
      displayName: 'CV app',
      description: 'A CV app',
      clientId: 'mycv.work',
      operator: 'https://smoothoperator.work',
      jwksUrl: '/jwks',
      eventsUrl: '/events',
      clientKeys: clientKeys,
      keyStore: new MemoryKeyStore(),
      keyOptions: { modulusLength: 1024 }
    }
  })
  afterEach(() => {
    axios.post.mockClear()
  })

  describe('createClient', () => {
    beforeEach((done) => {
      axios.post.mockResolvedValueOnce({})
      const client = createClient(config)
      client.on('connect', () => done())
    })
    it('calls the operator to register the client service', () => {
      expect(axios.post).toHaveBeenCalledWith('https://smoothoperator.work/api/clients', expect.any(Object))
    })
    it('sends correct parameters', () => {
      expect(axios.post).toHaveBeenCalledWith(expect.any(String), {
        data: {
          displayName: 'CV app',
          description: 'A CV app',
          clientId: 'mycv.work',
          jwksUrl: '/jwks',
          eventsUrl: '/events'
        },
        signature: {
          data: expect.any(String),
          kid: 'client_key'
        }
      })
    })
    it('signs the payload', () => {
      createClient(config)
      const [, { data, signature }] = axios.post.mock.calls[0]
      const verified = createVerify('RSA-SHA256')
        .update(JSON.stringify(data))
        .verify(clientKeys.publicKey, signature.data, 'base64')

      expect(verified).toEqual(true)
    })
  })
  describe('unsafe createClient', () => {
    beforeEach((done) => {
      axios.post.mockResolvedValueOnce({})
      config.unsafe = true
      const client = createClient(config)
      client.on('connect', () => done())
    })
    it('calls the operator to register the client service', () => {
      expect(axios.post).toHaveBeenCalledWith('https://smoothoperator.work/api/clients', expect.any(Object))
    })
    it('sends correct parameters', () => {
      expect(axios.post).toHaveBeenCalledWith(expect.any(String), {
        data: {
          displayName: 'CV app',
          description: 'A CV app',
          clientId: 'mycv.work',
          jwksUrl: '/jwks',
          eventsUrl: '/events',
          unsafe: true
        },
        signature: {
          data: expect.any(String),
          kid: 'client_key'
        }
      })
    })
    it('signs the payload', () => {
      createClient(config)
      const [, { data, signature }] = axios.post.mock.calls[0]
      const verified = createVerify('RSA-SHA256')
        .update(JSON.stringify(data))
        .verify(clientKeys.publicKey, signature.data, 'base64')

      expect(verified).toEqual(true)
    })
  })
})
