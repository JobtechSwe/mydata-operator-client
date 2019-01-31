const Joi = require('joi')

const scopeEntry = Joi.object({
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

const consentRequest = Joi.object({
  scope: Joi.array().items(scopeEntry).min(1).required(),
  expiry: Joi.number().integer().positive().required()
})

const consent = Joi.object({
  consentRequestId: Joi.string().uuid().required(),
  consentId: Joi.string().uuid().required(),
  consentEncryptionKeyId: Joi.string().required(),
  accountKey: Joi.string().base64().required(),
  accessToken: Joi.string().required(),
  scope: Joi.array().items(scopeEntry).min(1).required()
}).required()

const dataUpdate = Joi.object({
  accountId: Joi.string().uuid().required(),
  data: Joi.object({})
})

const eventPayloads = {
  CONSENT_APPROVED: consent,
  DATA_UPDATE: dataUpdate
}

const event = (type) => Joi.object({
  type: Joi.string().valid([
    'CONSENT_APPROVED', 'DATA_UPDATE'
  ]).required(),
  payload: eventPayloads[type] || Joi.object().required()
})

const configSchema = Joi.object({
  clientId: Joi.string().required(),
  displayName: Joi.string().required(),
  description: Joi.string().required().min(10),
  eventsUrl: Joi.string().optional(),
  jwksUrl: Joi.string().optional(),
  unsafe: Joi.bool().optional(),
  operator: Joi.string().uri().required(),
  clientKeys: Joi.object({
    publicKey: Joi.string().required(),
    privateKey: Joi.string().required()
  }).required(),
  keyStore: Joi.object().required(),
  keyOptions: Joi.object().optional() // TODO: Describe key options
})

module.exports = {
  consentRequest,
  event,
  scopeEntry,
  configSchema
}
