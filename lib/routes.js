const NodeRSA = require('node-rsa')
const { emitters } = require('./events')

const jwks = ({keyProvider}) => async (req, res, next) => {
  const keys = await keyProvider.jwks()
  res.send(keys)
}

const events = _ => async ({ body }, res, next) => {
  try {
    switch (body.type) {
      case 'CONSENT_APPROVED':
        emitters.consentApproved(body.payload)
        break
      default:
        return res.sendStatus(400)
    }
  } catch (error) {
    if (error.name === 'ValidationError') {
      res.sendStatus(400)
    } else {
      res.sendStatus(500)
    }
  }
  res.sendStatus(200)
}

module.exports = client => ({
  jwks: jwks(client),
  events: events()
})
