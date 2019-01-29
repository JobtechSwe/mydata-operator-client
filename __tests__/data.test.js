const dataService = require('../lib/data')
const axios = require('axios')
jest.mock('axios')

describe('data', () => {
  let config, accessToken

  describe('#get', () => {
    let get
    beforeEach(() => {
      axios.get = jest.fn()
      config = { operatorUrl: 'http://localhost:3000' }
      accessToken = 'asuidiuasduaisd'

      get = dataService({ config })
        .auth(accessToken)
        .get
    })

    it('calls axios.get with correct url and header', async () => {
      axios.get.mockResolvedValue({ data: { foo: 'bar' } })
      await get({ domain: 'cv', area: '/foo' })

      expect(axios.get).toHaveBeenCalledTimes(1)
      expect(axios.get).toHaveBeenCalledWith('http://localhost:3000/api/data/cv',
        { headers: { 'Authorization': 'Bearer asuidiuasduaisd' } })
    })

    it('returns data', async () => {
      axios.get.mockResolvedValue({ data: { foo: 'bar' } })

      const result = await get({ domain: 'cv', area: '/foo' })

      expect(result).toEqual({ foo: 'bar' })
    })
  })

  describe('#set', () => {
    let set
    beforeEach(() => {
      axios.post = jest.fn()
      config = { operatorUrl: 'http://localhost:3000' }
      accessToken = 'lkfdgf'
      set = dataService({ config })
        .auth(accessToken)
        .set
    })

    it('calls axios.post with correct url, data and header', async () => {
      const data = { foo: 'bar' }
      await set({ domain: 'cv', area: '/foo', data })

      expect(axios.post).toHaveBeenCalledTimes(1)
      expect(axios.post).toHaveBeenCalledWith('http://localhost:3000/api/data/cv', { foo: 'bar' },
        { headers: { 'Authorization': 'Bearer lkfdgf' } }
      )
    })
  })
})
