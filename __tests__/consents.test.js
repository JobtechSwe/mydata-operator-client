const createClient = require('../lib/client')
const MemoryKeyStore = require('../lib/memoryKeyStore')
const { generateKeyPairSync } = require('crypto')
const { v4 } = require('uuid')
const axios = require('axios')
jest.mock('axios')

describe('consents', () => {
  let clientKeys, client, dummyRequest, dummyResponse

  beforeAll(() => {
    clientKeys = generateKeyPairSync('rsa', {
      modulusLength: 1024,
      publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs1', format: 'pem' }
    })
  })
  beforeEach(() => {
    const config = {
      displayName: 'CV app',
      description: 'A CV app with a description which is longer than 10 chars',
      clientId: 'mycv.work',
      operator: 'https://smoothoperator.work',
      jwksUrl: '/jwks',
      eventsUrl: '/events',
      clientKeys: clientKeys,
      keyStore: new MemoryKeyStore(),
      keyOptions: { modulusLength: 1024 }
    }
    client = createClient(config)
  })
  afterEach(() => {
    axios.post.mockClear()
  })

  describe('#request', () => {
    beforeEach(() => {
      dummyRequest = {
        scope:
          [{
            domain: 'localhost:4000',
            area: 'cv',
            description:
              'A list of your work experiences, educations, language proficiencies and so on that you have entered in the service.',
            permissions: ['WRITE'],
            purpose: 'In order to create a CV using our website.',
            lawfulBasis: 'CONSENT',
            required: true
          }],
        expiry: 1549704812
      }

      dummyResponse = {
        data: {
          data: {
            code: '4445',
            expires: 345678
          }
        }
      }

      axios.post.mockResolvedValue(dummyResponse)
    })
    describe('validation', () => {
      it('throws if scope is missing', () => {
        dummyRequest.scope = undefined
        return expect(client.consents.request(dummyRequest))
          .rejects.toThrow(/\["scope" is required\]/)
      })
      it('throws if expiry is missing', () => {
        dummyRequest.expiry = undefined
        return expect(client.consents.request(dummyRequest))
          .rejects.toThrow(/\["expiry" is required\]/)
      })
      it('fixes casing of permissions', () => {
        dummyRequest.scope[0].permissions = ['write']
        return expect(client.consents.request(dummyRequest))
          .resolves.not.toThrow()
      })
      it('fixes casing of lawfulBasis', () => {
        dummyRequest.scope[0].lawfulBasis = 'legalObligation'
        return expect(client.consents.request(dummyRequest))
          .resolves.not.toThrow()
      })
    })
    it('calls operator with correct url', async () => {
      await client.consents.request(dummyRequest)
      expect(axios.post).toHaveBeenLastCalledWith(`https://smoothoperator.work/api/consents/requests`, expect.any(Object))
    })
    it('calls operator with correct payload', async () => {
      await client.consents.request(dummyRequest)
      const expectedPayload = {
        data: {
          ...dummyRequest,
          clientId: 'mycv.work',
          kid: expect.any(String)
        },
        signature: {
          alg: 'RSA-SHA512',
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
  describe.skip('#onApprove', () => { // TODO: Rename to onApproved ?
    let dummyApproval
    beforeEach(() => {
      dummyApproval = {
        consentRequestId: v4(),
        consentId: v4(),
        consentEncryptionKeyId: 'enc_20190128154632',
        accountKey: v4(),
        scope:
          [{
            domain: 'localhost:4000',
            area: 'cv',
            description:
              'A list of your work experiences, educations, language proficiencies and so on that you have entered in the service.',
            permissions: ['WRITE'],
            purpose: 'In order to create a CV using our website.',
            lawfulBasis: 'CONSENT',
            required: true
          }]
      }
    })
    it('works', async () => {
      client.consents.onApprove(dummyApproval)
    })
  })
})
