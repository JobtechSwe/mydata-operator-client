const axios = require('axios')
const {createSign} = require('crypto')

function create(config) {
  connect(config)
  return {

  }
}

async function connect({
  operator, name, description, clientId, jwksUrl, clientKeys
}) {
  const data = { name, description, clientId, jwksUrl}
  const signature = createSign('RSA-SHA256')
    .update(JSON.stringify(data))
    .sign(clientKeys.privateKey, 'base64')
  axios.post(`${operator}/clients`, {data, signature})
}

module.exports = create
