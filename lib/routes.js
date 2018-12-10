const NodeRSA = require('node-rsa')

function routes(config) {
  return {
    jwks: () => async (req, res, next) => {
      const keys = await allKeys(config)
      res.send(keys)
    }
  }
}

async function allKeys (config) {
  return {
    keys: [
      serializeKey(config.clientKeys.publicKey, 'client_key', 'sig')
    ]
  }
}

function serializeKey(key, kid, use) {
  const {keyPair: {e, n}} = new NodeRSA(key)
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
