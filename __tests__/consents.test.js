const { request } = require('../lib/consents')
const axios = require('axios')
jest.mock('axios')

describe('consents', () => {
  const config = {
    displayName: 'My CV',
    description: 'An app for your CV online',
    clientId: 'https://mycv.com',
    operator: 'https://operator.work',
    jwksUrl: '/jwks',
    clientKeys: {
      publicKey: 'uhahsdiuashdiuasd',
      privateKey: 'asdiuhas'
    }
  }

  const dummyConsent = {
    scope: ['everything']
  }

  const dummyResponse = {
    data: {
      data: {
        code: '4445',
        expires: 345678
      }
    }
  }

  describe('#request', () => {
    beforeEach(() => {
      axios.post.mockResolvedValue(dummyResponse)
    })

    it('calls axios.post with correct url', async () => {
      await request(config)(dummyConsent)

      expect(axios.post).toHaveBeenCalledTimes(1)
      expect(axios.post).toHaveBeenCalledWith(`${config.operator}/api/consents/requests`, { client_id: 'https://mycv.com', scope: ['everything'] })
    })

    it('unwraps response and returns code', async () => {
      const { code } = await request(config)(dummyConsent)

      expect(code).toBe('4445')
    })
  })
})
