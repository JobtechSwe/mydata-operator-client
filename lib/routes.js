const { Router } = require('express')

const jwksHandler = ({ keyProvider }) => async (req, res, next) => {
  const keys = await keyProvider.jwks()
  res.send(keys)
}

const eventsHandler = client => async ({ body }, res, next) => {
  switch (body.type) {
    case 'CONSENT_APPROVED':
      client.events.emit('CONSENT_APPROVED', body.payload)
      break
    default:
      return res.sendStatus(400)
  }
  res.sendStatus(200)
}

module.exports = client => {
  const router = new Router()

  router.get(client.config.jwksUrl, jwksHandler(client))
  router.post(client.config.eventsUrl, eventsHandler(client))

  return router
}
