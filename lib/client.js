const axios = require('axios')
const {createSign} = require('crypto')
const routes = require('./routes')

function create(config) {
  connect(config)
  return {
    routes: routes(config)
  }
}

async function connect({
  operator, displayName, description, clientId, jwksUrl, clientKeys
}) {
  const data = { displayName, description, clientId, jwksUrl}
  const signature = createSign('RSA-SHA256')
    .update(JSON.stringify(data))
    .sign(clientKeys.privateKey, 'base64')
  axios.post(`${operator}/api/clients`, {data, signature})
}

module.exports = create
