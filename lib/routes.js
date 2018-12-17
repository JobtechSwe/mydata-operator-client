const NodeRSA = require('node-rsa')
const { emitters } = require('./events')

const jwks = config => async (req, res, next) => {
  const keys = await allKeys(config)
  res.send(keys)
}

const events = config => async ({ body }, res, next) => {
  try {
    switch (body.type) {
      case 'CONSENT_APPROVED':
        emitters.consentApproved(body.payload)
        break
      default:
        return res.sendStatus(400)
    }
  } catch (error) {
    if (error.name === 'ValidationError') {
      res.sendStatus(400)
    } else {
      res.sendStatus(500)
    }
  }
  res.sendStatus(200)
}

const routes = config => ({
  jwks: jwks(config),
  events: events(config)
})

async function allKeys (config) {
  const clientKey = serializeKey(config.clientKeys.publicKey, 'client_key', 'sig')
  // const signKeys = await serializeKeys(config.signKeyProvider, 'sig')
  // const encryptionKeys = await serializeKeys(config.encryptKeyProvider, 'enc')
  return {
    keys: [
      clientKey
      // ...signKeys,
      // ...encryptionKeys
    ]
  }
}

/*
async function serializeKeys (provider, use) {
  const keys = await provider()
  return keys.map(({ kid, key }) => serializeKey(key, kid, use))
}
*/

function serializeKey (key, kid, use) {
  const { keyPair: { e, n } } = new NodeRSA(key)
  const bufE = Buffer.alloc(4)
  bufE.writeInt32BE(e)
  const strE = bufE.slice(1).toString('base64')
  const strN = n.toBuffer().toString('base64')

  const serialized = {
    kid,
    use,
    alg: 'RS256',
    kty: 'RSA',
    n: strN,
    e: strE
  }
  return serialized
}

module.exports = routes
