const createClient = require('../lib/client')
const MemoryKeyStore = require('../lib/memoryKeyStore')
const { generateKeyPairSync } = require('crypto')
const axios = require('axios')
jest.mock('axios')

describe('consents', () => {
  let client, dummyRequest, dummyResponse

  beforeEach(() => {
    const clientKeys = generateKeyPairSync('rsa', {
      modulusLength: 1024,
      publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs1', format: 'pem' }
    })
    const config = {
      displayName: 'CV app',
      description: 'A CV app',
      clientId: 'https://mycv.work',
      operator: 'https://smoothoperator.work',
      jwksUrl: '/jwks',
      clientKeys: clientKeys,
      keyStore: new MemoryKeyStore(),
      keyOptions: { modulusLength: 1024 }
    }
    client = createClient(config)

    dummyRequest = {
      scope: ['everything']
    }

    dummyResponse = {
      data: {
        data: {
          code: '4445',
          expires: 345678
        }
      }
    }
  })
  afterEach(() => {
    axios.post.mockClear()
  })

  describe('#request', () => {
    beforeEach(() => {
      axios.post.mockResolvedValue(dummyResponse)
    })
    it('calls operator with correct url', async () => {
      await client.consents.request(dummyRequest)
      expect(axios.post).toHaveBeenLastCalledWith(`${client.operator}/api/consents/requests`, expect.any(Object))
    })
    it('calls operator with correct payload', async () => {
      await client.consents.request(dummyRequest)
      const expectedPayload = {
        data: {
          client_id: 'https://mycv.work',
          scope: ['everything'],
          kid: expect.any(String)
        },
        signature: {
          kid: 'client_key',
          data: expect.any(String)
        }
      }
      expect(axios.post).toHaveBeenLastCalledWith(expect.any(String), expectedPayload)
    })
    it('unwraps response and returns code', async () => {
      const { code } = await client.consents.request(dummyRequest)

      expect(code).toBe('4445')
    })
  })
})
