const Joi = require('joi')
const { pipe, curry } = require('ramda')
const EventEmitter = require('events')
class Emitter extends EventEmitter {}
const emitter = new Emitter()

const validate = curry((schema, body) => Joi.validate(body, schema, { abortEarly: false, convert: false }))

const afterValidation = f => item =>
  item.error
    ? item
    : f(item.value)

const withValidation = schema => f => pipe(
  validate(schema),
  afterValidation(f)
)

const consentSchema = {
  id: Joi.string().guid().required(),
  scope: Joi.array().items(Joi.string()).min(1).required()
}

module.exports = {
  events: emitter,
  emitters: {
    consentApproved: withValidation(consentSchema)(payload => emitter.emit('CONSENT_APPROVED', payload))
  }
}
