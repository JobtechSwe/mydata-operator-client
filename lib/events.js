const { withValidation, Joi } = require('./validation')
const EventEmitter = require('events')
const emitter = new EventEmitter()

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
