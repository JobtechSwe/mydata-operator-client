import axios from 'axios'
import jwt from 'jsonwebtoken'

const getLoginUrl = ({ clientId, operatorUrl }) => redirectUri => `${operatorUrl}/login?redirect_uri=${redirectUri}&client_id=${clientId}`

const getAccountIdFromToken = (token) => {
  const { account: { id } } = jwt.decode(token)
  return id
}

const makeReader = operatorUrl => async (path, token) => {
  if (!token) {
    throw Error('token is missing')
  }
  const accountId = getAccountIdFromToken(token)

  const response = await axios.get(
    `${operatorUrl}/api/accounts/${encodeURIComponent(accountId)}/data${path}`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  )
  return response.data.data
}

const makeWriter = operatorUrl => async (path, data, token) => {
  if (!token) {
    throw Error('token is missing')
  }
  const accountId = getAccountIdFromToken(token)
  const url = `${operatorUrl}/api/accounts/${encodeURIComponent(accountId)}/data${path}`
  try {
    await axios.put(url, data,
      { headers: { 'Authorization': `Bearer ${token}` } })
  } catch (err) {
    throw err
  }
}

const createClient = ({ clientId, operatorUrl = 'http://operator.mydata.work' }) => {
  return {
    write: makeWriter(operatorUrl),
    read: makeReader(operatorUrl),
    getLoginUrl: getLoginUrl({ clientId, operatorUrl })
  }
}

export {
  createClient
}
