import axios from 'axios'
import jwt from 'jsonwebtoken'

const config = {
  clientId: null,
  operatorUrl: null,
  initialized: false
}

const isInitialized = () => config.initialized

const init = ({ clientId, operatorUrl = 'http://operator.mydata.work' }) => {
  if (config.initialized) {
    throw Error('Operator has already been initialized')
  }
  config.clientId = clientId
  config.operatorUrl = operatorUrl
  config.initialized = true
}

const getLoginUrl = redirectUri => `${config.operatorUrl}/login?redirect_uri=${redirectUri}&client_id=${config.clientId}`

const getAccountIdFromToken = (token) => {
  const { account: { id } } = jwt.decode(token)
  return id
}

const read = async (path, token) => {
  if (!config.initialized) {
    throw Error('operator is not initialized')
  }
  if (!token) {
    throw Error('token is missing')
  }
  const accountId = getAccountIdFromToken(token)

  const response = await axios.get(
    `${config.operatorUrl}/api/accounts/${encodeURIComponent(accountId)}/data${path}`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  )
  return response.data.data
}

const write = async (path, data, token) => {
  if (!config.initialized) {
    throw Error('operator is not initialized')
  }
  if (!token) {
    throw Error('token is missing')
  }
  const accountId = getAccountIdFromToken(token)
  const url = `${config.operatorUrl}/api/accounts/${encodeURIComponent(accountId)}/data${path}`
  try {
    await axios.put(url, data,
      { headers: { 'Authorization': `Bearer ${token}` } })
  } catch (err) {
    throw err
  }
}

// Helper func for testing
const clearConfig = () => {
  Object.keys(config).forEach(k => {
    config[k] = undefined
  })
  config.initialized = false
}

export {
  init,
  isInitialized,
  getLoginUrl,
  write,
  read,
  clearConfig
}
