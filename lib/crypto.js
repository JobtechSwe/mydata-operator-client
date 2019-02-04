const {
  createCipheriv,
  createDecipheriv,
  publicEncrypt,
  privateDecrypt,
  randomBytes
} = require('crypto')
const { promisify } = require('util')

async function generateDocumentKey (encoding) {
  const key = await promisify(randomBytes)(32)
  return encoding ? key.toString(encoding) : key
}

function encryptDocumentKey (aesDocumentKey, pubEncryptionKey, encoding) {
  if (typeof documentKey === 'string') aesDocumentKey = Buffer.from(aesDocumentKey, 'base64')
  const encrypted = publicEncrypt(pubEncryptionKey, aesDocumentKey)
  return encoding ? encrypted.toString('base64') : encrypted
}

function decryptDocumentKey (pubEncryptedDocumentKey, privDecryptionKey, encoding) {
  if (typeof pubEncryptedDocumentKey === 'string') pubEncryptedDocumentKey = Buffer.from(pubEncryptedDocumentKey, 'base64')
  const decrypted = privateDecrypt(privDecryptionKey, pubEncryptedDocumentKey)
  return encoding ? decrypted.toString(encoding) : decrypted
}

async function encryptDocument (aesKey, data, encoding) {
  const iv = await promisify(randomBytes)(16)
  const cipher = createCipheriv('aes-256-cbc', aesKey, iv)
  const buf = Buffer.concat([iv, cipher.update(data), cipher.final()])
  return encoding ? buf.toString(encoding) : buf
}

function decryptDocument (aesKey, data) {
  if (typeof data === 'string') data = Buffer.from(data, 'base64')
  const iv = data.slice(0, 16)
  const decipher = createDecipheriv('aes-256-cbc', aesKey, iv)
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
