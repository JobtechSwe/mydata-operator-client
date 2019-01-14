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
    let client
    beforeEach((done) => {
      axios.post.mockResolvedValueOnce({})
      client = createClient(config)
      setTimeout(() => done(), 10)
    })
    it('does _not_ call the operator to register until told so', () => {
      expect(axios.post).not.toHaveBeenCalled()
    })
    it('sets sensible defaults', () => {
      const {
        displayName,
        description,
        clientId,
        operator,
        clientKeys,
        keyStore
      } = config
      client = createClient({
        displayName,
        description,
        clientId,
        operator,
        clientKeys,
        keyStore
      })
      expect(client.config.jwksUrl).toEqual('/jwks')
      expect(client.config.eventsUrl).toEqual('/events')
      expect(client.config.alg).toEqual('RSA-SHA512')
    })
    describe('#connect()', () => {
      beforeEach(async () => {
        await client.connect()
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
            alg: 'RSA-SHA512',
            kid: 'client_key'
          }
        })
      })
      it('signs the payload', () => {
        createClient(config)
        const [, { data, signature }] = axios.post.mock.calls[0]
        const verified = createVerify(signature.alg)
          .update(JSON.stringify(data))
          .verify(clientKeys.publicKey, signature.data, 'base64')

        expect(verified).toEqual(true)
      })
    })
  })
  describe('unsafe createClient', () => {
    beforeEach(async () => {
      axios.post.mockResolvedValueOnce({})
      config.unsafe = true
      const client = createClient(config)
      await client.connect()
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
          alg: 'RSA-SHA512',
          data: expect.any(String),
          kid: 'client_key'
        }
      })
    })
    it('signs the payload', () => {
      createClient(config)
      const [, { data, signature }] = axios.post.mock.calls[0]
      const verified = createVerify(signature.alg)
        .update(JSON.stringify(data))
        .verify(clientKeys.publicKey, signature.data, 'base64')

      expect(verified).toEqual(true)
    })
  })
})
