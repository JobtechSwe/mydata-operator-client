const axios = require('axios')

const buildUrl = (operatorUrl, domain) => `${operatorUrl}/api/data/${domain}` // TODO: Do not ignore area parameter
const buildHeaders = accessToken => ({ 'Authorization': 'Bearer ' + accessToken })

const get = (operatorUrl, accessToken) => async ({ domain, area }) => {
  const url = buildUrl(operatorUrl, domain) // TODO: Do not ignore area parameter
  const headers = buildHeaders(accessToken)
  const { data } = await axios.get(url, { headers })
  return data
}

const set = (operatorUrl, accessToken) => async ({ domain, area, data }) => {
  const url = buildUrl(operatorUrl, domain) // TODO: Do not ignore area parameter
  const headers = buildHeaders(accessToken)
  await axios.post(url, data, { headers })
}

const auth = operatorUrl => accessToken => ({
  get: get(operatorUrl, accessToken),
  set: set(operatorUrl, accessToken)
})

module.exports = client => ({
  auth: auth(client.config.operatorUrl)
})
