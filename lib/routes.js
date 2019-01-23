const createError = require('http-errors')
const { Router } = require('express')
const { event } = require('./schemas')

const keyListHandler = ({ keyProvider }) => async (req, res, next) => {
  const keys = await keyProvider.jwksKeyList()
  res.send(keys)
}

const keyHandler = ({ keyProvider }) => async (req, res, next) => {
  const key = await keyProvider.jwksKey(req.params.kid)
  res.send(key)
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

  router.get(client.config.jwksUrl, keyListHandler(client))
  router.get(`${client.config.jwksUrl}/:kid`, keyHandler(client))
  router.post(client.config.eventsUrl, eventsHandler(client))

  return router
}
