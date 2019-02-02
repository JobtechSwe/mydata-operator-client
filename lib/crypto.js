const {
  createCipheriv,
  createDecipheriv,
  createHash,
  publicEncrypt,
  privateDecrypt,
  randomBytes
} = require('crypto')
const { v4 } = require('uuid')

function generateDocumentKey () {
  return createHash('SHA256')
    .update(v4())
    .digest()
}

function encryptDocument (key, data) {
  const iv = randomBytes(16)
  const cipher = createCipheriv('aes-256-cbc', key, iv)
  return Buffer.concat([iv, cipher.update(data), cipher.final()])
}

function encryptDocumentKey (documentKey, encryptionKey) {
  return publicEncrypt(encryptionKey, documentKey)
}

function decryptDocumentKey (encryptedDocumentKey, decryptionKey) {
  return privateDecrypt(decryptionKey, encryptedDocumentKey)
}

function decryptDocument (key, data) {
  if (typeof data === 'string') data = Buffer.from(data, 'base64')
  const iv = data.slice(0, 16)
  const decipher = createDecipheriv('aes-256-cbc', key, iv)
  return Buffer.concat([
    decipher.update(data.slice(16)),
    decipher.final()
  ]).toString('utf8')
}

module.exports = {
  generateDocumentKey,
  encryptDocumentKey,
  decryptDocumentKey,
  encryptDocument,
  decryptDocument
}
