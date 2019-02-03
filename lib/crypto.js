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

function encryptDocumentKey (documentKey, encryptionKey, encoding) {
  if (typeof documentKey === 'string') documentKey = Buffer.from(documentKey, 'base64')
  const encrypted = publicEncrypt(encryptionKey, documentKey)
  return encoding ? encrypted.toString('base64') : encrypted
}

function decryptDocumentKey (encryptedDocumentKey, decryptionKey, encoding) {
  if (typeof encryptedDocumentKey === 'string') encryptedDocumentKey = Buffer.from(encryptedDocumentKey, 'base64')
  const decrypted = privateDecrypt(decryptionKey, encryptedDocumentKey)
  return encoding ? decrypted.toString(encoding) : decrypted
}

async function encryptDocument (key, data, encoding) {
  const iv = await promisify(randomBytes)(16)
  const cipher = createCipheriv('aes-256-cbc', key, iv)
  const buf = Buffer.concat([iv, cipher.update(data), cipher.final()])
  return encoding ? buf.toString(encoding) : buf
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
