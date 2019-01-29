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
      description: 'A CV app with a description which is at least 10 chars',
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

    it('throws if clientId is missing', () => {
      config.clientId = undefined
      expect(() => createClient(config)).toThrow()
    })

    it('throws if displayName is missing', () => {
      config.displayName = undefined
      expect(() => createClient(config)).toThrow()
    })

    it('throws if operator is missing', () => {
      config.operator = undefined
      expect(() => createClient(config)).toThrow()
    })

    it('throws if operator is not a valid uri', () => {
      config.operator = 'fobara87as9duadh'
      expect(() => createClient(config)).toThrow()
    })

    it('throws if keyStore is missing', () => {
      config.keyStore = undefined
      expect(() => createClient(config)).toThrow()
    })

    it('throws if clientKeys is missing', () => {
      config.clientKeys = undefined
      expect(() => createClient(config)).toThrow()
    })

    describe('#connect()', () => {
      it('calls the operator to register the client service', async () => {
        await client.connect()
        expect(axios.post).toHaveBeenCalledWith('https://smoothoperator.work/api/clients', expect.any(Object))
      })

      it('sends correct parameters', async () => {
        await client.connect()
        expect(axios.post).toHaveBeenCalledWith(expect.any(String), {
          data: {
            displayName: 'CV app',
            description: 'A CV app with a description which is at least 10 chars',
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

      it('calls events.emit with payload', async () => {
        client.events.emit = jest.fn()
        await client.connect()
        expect(client.events.emit).toHaveBeenCalledTimes(1)
      })

      it('signs the payload', async () => {
        await client.connect()
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
          description: 'A CV app with a description which is at least 10 chars',
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

  describe('#onConsentApproved', () => {
    it('removes key with matching kid from keystore', async () => {
      const client = createClient(config)
      const key = {
        kid: 'foo'
      }
      await client.keyProvider.keyStore.save(key)

      const payload = { kid: 'foo' }
      client.events.emit('CONSENT_APPROVED', payload)

      const res = await client.keyProvider.keyStore.load({ kid: 'foo' })

      expect(res).toEqual([])
    })
  })
})
