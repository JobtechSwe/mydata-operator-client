import * as client from '../src/index'
import axios from 'axios'
import jwt from 'jsonwebtoken'
jest.mock('axios')
jest.mock('jsonwebtoken')

const clientConfig = {
  clientId: 'myclient123'
}

describe('client', () => {
  beforeEach(() => {
    client.init(clientConfig)
  })

  afterEach(() => {
    client.clearConfig()
  })

  describe('#getLoginUrl', () => {
    it('returns correct url', () => {
      const loginUrl = client.getLoginUrl('myredirecturi')

      expect(loginUrl).toBe('http://operator.mydata.work/login?redirect_uri=myredirecturi&client_id=myclient123')
    })
  })

  describe('#write', () => {
    it('calls axios.put', async () => {
      jwt.decode.mockReturnValue({ account: { id: 'userId' } })

      await client.write('/education', {}, 'itsatoken')

      expect(axios.put).toHaveBeenCalled()
    })
  })
})
