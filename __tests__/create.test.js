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
      })
    }
    config = {
      name: 'CV app',
      description: 'A CV app',
      clientId: 'https://mycv',
      operator: 'https://smoothoperator.work',
      jwksUrl: '/jwks',
      clientKeys: keys.client
    }
  })
  afterEach(() => {
    axios.post.mockClear()
  })

  describe('create', () => {
    it('calls the operator to register the client service', () => {
      create(config)
      expect(axios.post).toHaveBeenCalledWith('https://smoothoperator.work/clients', expect.any(Object))
    })
    it('sends correct parameters', () => {
      create(config)
      expect(axios.post).toHaveBeenCalledWith(expect.any(String), {
        data: {
          name: 'CV app',
          description: 'A CV app',
          clientId: 'https://mycv',
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
})
