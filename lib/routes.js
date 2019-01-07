const { emitters } = require('./events')
const { Router } = require('express')

const jwks = ({ keyProvider }) => async (req, res, next) => {
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

module.exports = client => {
  const router = new Router()

  router.get(client.config.jwksUrl, jwks(client))
  router.post(client.config.eventsUrl, events())

  return router
}
