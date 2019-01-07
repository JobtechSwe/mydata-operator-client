const createClient = require('../lib/client')
const MemoryKeyStore = require('../lib/memoryKeyStore')
const { generateKeyPairSync } = require('crypto')
const request = require('supertest')
const express = require('express')
jest.mock('axios')

describe('routes', () => {
  let clientKeys, client, app

  beforeAll(() => {
    clientKeys = generateKeyPairSync('rsa', {
      modulusLength: 1024,
      publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs1', format: 'pem' }
    })
  })
  beforeEach(() => {
    const config = {
      displayName: 'CV app',
      description: 'A CV app',
      clientId: 'mycv.work',
      operator: 'https://smoothoperator.work',
      jwksUrl: '/jwks',
      eventsUrl: '/events',
      clientKeys: clientKeys,
      keyStore: new MemoryKeyStore(),
      keyOptions: { modulusLength: 1024 }
    }
    client = createClient(config)
    app = express()
    app.use(express.json())
    app.use(client.routes)
  })
  describe('/jwks', () => {
    it('contains the client_key', async () => {
      const res = await request(app).get('/jwks')

      expect(res.body).toEqual({
        keys: [
          {
            kid: 'client_key',
            alg: 'RS256',
            kty: 'RSA',
            use: 'sig',
            e: 'AQAB',
            n: expect.any(String)
          }
        ]
      })
    })

    it('contains client_key, enc keys and sig keys', async () => {
      await client.keyProvider.generate({ use: 'enc' })
      await client.keyProvider.generate({ use: 'sig' })

      const res = await request(app).get('/jwks')

      expect(res.body).toEqual({
        keys: [
          {
            kid: 'client_key',
            alg: 'RS256',
            kty: 'RSA',
            use: 'sig',
            e: 'AQAB',
            n: expect.any(String)
          },
          {
            kid: expect.any(String),
            alg: 'RS256',
            kty: 'RSA',
            use: 'enc',
            e: 'AQAB',
            n: expect.any(String)
          },
          {
            kid: expect.any(String),
            alg: 'RS256',
            kty: 'RSA',
            use: 'sig',
            e: 'AQAB',
            n: expect.any(String)
          }
        ]
      })
    })
  })
  describe('/events', () => {
    it('triggers an event', async () => {
      const listener = jest.fn()
      client.events.on('CONSENT_APPROVED', listener)

      const event = {
        type: 'CONSENT_APPROVED',
        payload: {
          id: '566c9327-b1cb-4e5b-8633-3b1f1fbbe9ad',
          scope: ['Foo']
        }
      }
      await request(app).post('/events').send(event)

      expect(listener).toHaveBeenCalledWith(event.payload)
    })
  })
})
