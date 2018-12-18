const axios = require('axios')
module.exports = client => ({
  request: async consent => {
    const encKey = await client.keyProvider.generate({use: 'enc'})
    const data = {
      ...consent,
      client_id: client.config.clientId,
      kid: encKey.kid
    }
    const signature = await client.sign(data, 'client_key')
    const url = `${client.operator}/api/consents/requests`
    const response = await axios.post(url, {data, signature})
    return response.data.data
  }
})
