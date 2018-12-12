const axios = require('axios')

module.exports = {
  request: config => async consent => {
    const response = await axios.post(`${config.operator}/api/consents/requests`, consent)

    return response.data.data
  }
}
