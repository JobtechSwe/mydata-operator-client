const createError = require('http-errors')
const { Router } = require('express')
const { event } = require('./schemas')

const validationOptions = {
  abortEarly: false,
  convert: false
}

const jwksHandler = ({ keyProvider }) => async (req, res, next) => {
  const keys = await keyProvider.jwks()
  res.send(keys)
}

const eventsHandler = client => async ({ body }, res, next) => {
  try {
    await event(body.type).validate(body)
    client.events.emit(body.type, body.payload)
    res.sendStatus(200)
  } catch (error) {
    if (error.name === 'ValidationError') {
      next(createError(400, error))
    } else {
      next(error)
    }
  }
}

module.exports = client => {
  const router = new Router()

  router.get(client.config.jwksUrl, jwksHandler(client))
  router.post(client.config.eventsUrl, eventsHandler(client))

  return router
}
