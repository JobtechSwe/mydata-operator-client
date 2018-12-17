const { emitters } = require('../lib/events')
jest.mock('events')

describe('events', () => {
  describe('#emitters.consentApproved', () => {
    it('returns ValidationError if schema is not fulfilled', () => {
      const { error } = emitters.consentApproved({ foo: 'bar' })
      expect(error.name).toBe('ValidationError')
    })
  })
})
