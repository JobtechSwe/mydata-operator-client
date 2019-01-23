const Joi = require('joi')

const scope = Joi.object({
  domain: Joi.string().required(),
  area: Joi.string().required(),
  description: Joi.string().required(),
  permissions: Joi.array()
    .items(Joi.string().valid(['READ', 'WRITE']))
    .min(1).required(),
  purpose: Joi.string().required(),
  lawfulBasis: Joi.string().valid([
    'CONSENT',
    'CONTRACT',
    'LEGAL_OBLIGATION',
    'VITAL_INTERESTS',
    'PUBLIC_TASK',
    'LEGITIMATE_INTERESTS'
  ]).required(),
  required: Joi.boolean().optional()
})

const consent = Joi.object({
  scope: Joi.array().items(scope).min(1).required(),
  expiry: Joi.number().integer().positive().required()
})

const eventPayloads = {
  CONSENT_APPROVED: Joi.object({
    consentId: Joi.string().required(),
    publicKey: Joi.string().base64().required(),
    scope: Joi.array().items(scope).min(1).required()
  }).required()
}

const event = (type) => Joi.object({
  type: Joi.string().valid([
    'CONSENT_APPROVED'
  ]).required(),
  payload: eventPayloads[type] || Joi.object().required()
})

module.exports = {
  consent,
  event,
  scope
}
