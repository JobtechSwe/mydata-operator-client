const axios = require('axios')
const { constant } = require('case')
const schemas = require('./schemas')

const fix = (consent) => ({
  ...consent,
  scope: Array.isArray(consent.scope)
    ? consent.scope.map(scope => ({
      ...scope,
      permissions: Array.isArray(scope.permissions)
        ? scope.permissions.map(p => constant(p))
        : scope.permissions,
      lawfulBasis: scope.lawfulBasis
        ? constant(scope.lawfulBasis)
        : scope.lawfulBasis
    }))
    : consent.scope
})

async function request (client, consentRequestDescription) {
  consentRequestDescription = fix(consentRequestDescription)
  await schemas.consentRequest.validate(consentRequestDescription)

  const encKey = await client.keyProvider.generateTemp({ use: 'enc' }, 60 * 60 * 1000)
  const data = {
    ...consentRequestDescription,
    clientId: client.config.clientId,
    kid: encKey.kid
  }
  const signature = await client.sign(data, 'client_key')
  const url = `${client.config.operator}/api/consents/requests`
  const response = await axios.post(url, { data, signature })
  return response.data.data
}

async function onApprove (client, consent) {

}

module.exports = client => ({
  request: (consentRequestDescription) => request(client, consentRequestDescription),
  onApprove: (consent) => onApprove(client, consent)
})
