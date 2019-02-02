const { generateKeyPair } = require('crypto')
const { promisify } = require('util')
const crypto = require('../lib/crypto')

describe('crypto', () => {
  let keys = []
  beforeAll(async () => {
    const options = {
      modulusLength: 1024,
      publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs1', format: 'pem' }
    }
    keys.push(await promisify(generateKeyPair)('rsa', options))
  })
  describe('#generateDocumentKey', () => {
    it('returns a 32 byte (256 bit) key', () => {
      const key = crypto.generateDocumentKey()
      expect(key).toBeInstanceOf(Buffer)
      expect(key.length).toEqual(32)
    })
  })
  describe('#encryptDocumentKey', () => {
    it('returns a buffer', () => {
      const key = crypto.generateDocumentKey()
      const encryptedKey = crypto.encryptDocumentKey(key, keys[0].publicKey)
      expect(encryptedKey).toBeInstanceOf(Buffer)
    })
  })
  describe('#decryptDocumentKey', () => {
    it('decrypts an encrypted key', () => {
      const key = crypto.generateDocumentKey()
      const encryptedKey = crypto.encryptDocumentKey(key, keys[0].publicKey)
      const decryptedKey = crypto.decryptDocumentKey(encryptedKey, keys[0].privateKey)
      expect(decryptedKey).toEqual(key)
    })
  })
  describe('#encryptDocument', () => {
    it('returns a Buffer', () => {
      const key = crypto.generateDocumentKey()
      const cipher = crypto.encryptDocument(key, 'foo: bar')
      expect(cipher).toBeInstanceOf(Buffer)
    })
  })
  describe('#decryptDocument', () => {
    it('decrypts an aecrypted document as buffer', () => {
      const key = crypto.generateDocumentKey()
      const cipher = crypto.encryptDocument(key, 'foo: bar')
      expect(crypto.decryptDocument(key, cipher)).toEqual('foo: bar')
    })
    it('decrypts an aecrypted document as base64', () => {
      const key = crypto.generateDocumentKey()
      const cipher = crypto.encryptDocument(key, 'foo: bar').toString('base64')
      expect(crypto.decryptDocument(key, cipher)).toEqual('foo: bar')
    })
  })
})
