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

module.exports = client => ({
  request: async consent => {
    consent = fix(consent)
    await schemas.consent.validate(consent)

    const encKey = await client.keyProvider.generate({ use: 'enc' })
    const data = {
      ...consent,
      clientId: client.config.clientId,
      kid: encKey.kid
    }
    const signature = await client.sign(data, 'client_key')
    const url = `${client.config.operator}/api/consents/requests`
    const response = await axios.post(url, { data, signature })
    return response.data.data
  }
})
