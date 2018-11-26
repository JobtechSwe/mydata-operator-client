import { createClient } from '../src/index'
import axios from 'axios'
import jwt from 'jsonwebtoken'
jest.mock('axios')
jest.mock('jsonwebtoken')

describe('client', () => {
  let client

  beforeEach(() => {
    client = createClient({
      clientId: 'myclient123',
      operatorUrl: 'http://test-operator.mydata.work'
    })
  })

  describe('#getLoginUrl', () => {
    it('returns correct url', () => {
      const loginUrl = client.getLoginUrl('myredirecturi')

      expect(loginUrl).toBe('http://test-operator.mydata.work/login?redirect_uri=myredirecturi&client_id=myclient123')
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
