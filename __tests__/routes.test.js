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
    app.use(({ status, message }, req, res, next) => {
      res.status(status).send({ message })
    })
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
    let body
    beforeEach(() => {
      body = {
        type: 'CONSENT_APPROVED',
        payload: {
          consentId: '566c9327-b1cb-4e5b-8633-3b1f1fbbe9ad',
          publicKey: Buffer.from('some key', 'utf8').toString('base64'),
          scope: [{
            domain: 'cv.work',
            area: 'education',
            description: 'Stuff',
            permissions: ['READ', 'WRITE'],
            purpose: 'because',
            lawfulBasis: 'CONSENT'
          }]
        }
      }
    })
    it('throws if body does not contain `type`', async () => {
      body.type = undefined
      const response = await request(app).post('/events').send(body)

      expect(response.status).toEqual(400)
      expect(response.body.message).toMatch('["type" is required]')
    })
    it('throws if body does not contain `payload`', async () => {
      body.payload = undefined
      const response = await request(app).post('/events').send(body)

      expect(response.status).toEqual(400)
      expect(response.body.message).toMatch('["payload" is required]')
    })
    it('throws if event type is unknown', async () => {
      body.type = 'SNEL_HEST'
      const response = await request(app).post('/events').send(body)

      expect(response.status).toEqual(400)
      expect(response.body.message).toMatch('["type" must be one of [CONSENT_APPROVED]]')
    })
    describe('[CONSENT_APPROVED]', () => {
      let listener
      beforeEach(() => {
        listener = jest.fn()
        client.events.on('CONSENT_APPROVED', listener)
      })
      it('throws if `consentId` is missing from payload', async () => {
        body.payload.consentId = undefined
        const response = await request(app).post('/events').send(body)

        expect(response.status).toEqual(400)
        expect(response.body.message).toMatch('["consentId" is required]')
      })
      it('throws if `publicKey` is missing from payload', async () => {
        body.payload.publicKey = undefined
        const response = await request(app).post('/events').send(body)

        expect(response.status).toEqual(400)
        expect(response.body.message).toMatch('["publicKey" is required]')
      })
      it('throws if `scope` is missing from payload', async () => {
        body.payload.scope = undefined
        const response = await request(app).post('/events').send(body)

        expect(response.status).toEqual(400)
        expect(response.body.message).toMatch('["scope" is required]')
      })
      it('throws if `scope` is empty', async () => {
        body.payload.scope = []
        const response = await request(app).post('/events').send(body)

        expect(response.status).toEqual(400)
        expect(response.body.message).toMatch('["scope" must contain at least 1 items]')
      })
      it('throws if `scope` does not contain `domain`', async () => {
        body.payload.scope[0].domain = undefined
        const response = await request(app).post('/events').send(body)

        expect(response.status).toEqual(400)
        expect(response.body.message).toMatch('["domain" is required]')
      })
      it('throws if `scope` does not contain `area`', async () => {
        body.payload.scope[0].area = undefined
        const response = await request(app).post('/events').send(body)

        expect(response.status).toEqual(400)
        expect(response.body.message).toMatch('["area" is required]')
      })
      it('throws if `scope` does not contain `description`', async () => {
        body.payload.scope[0].description = undefined
        const response = await request(app).post('/events').send(body)

        expect(response.status).toEqual(400)
        expect(response.body.message).toMatch('["description" is required]')
      })
      it('throws if `scope` does not contain `permissions`', async () => {
        body.payload.scope[0].permissions = undefined
        const response = await request(app).post('/events').send(body)

        expect(response.status).toEqual(400)
        expect(response.body.message).toMatch('["permissions" is required]')
      })
      it('throws if `scope` `permissions` is empty', async () => {
        body.payload.scope[0].permissions = []
        const response = await request(app).post('/events').send(body)

        expect(response.status).toEqual(400)
        expect(response.body.message).toMatch('["permissions" must contain at least 1 items]')
      })
      it('throws if `scope` `permissions` contains invalid values', async () => {
        body.payload.scope[0].permissions.push('derp')
        const response = await request(app).post('/events').send(body)

        expect(response.status).toEqual(400)
        expect(response.body.message).toMatch('must be one of [READ, WRITE]')
      })
      it('throws if `scope` does not contain `purpose`', async () => {
        body.payload.scope[0].purpose = undefined
        const response = await request(app).post('/events').send(body)

        expect(response.status).toEqual(400)
        expect(response.body.message).toMatch('["purpose" is required]')
      })
      it('throws if `scope` does not contain `lawfulBasis`', async () => {
        body.payload.scope[0].lawfulBasis = undefined
        const response = await request(app).post('/events').send(body)

        expect(response.status).toEqual(400)
        expect(response.body.message).toMatch('["lawfulBasis" is required]')
      })
      it('throws if `scope` `lawfulBasis` has invalid value', async () => {
        body.payload.scope[0].lawfulBasis = 'fish'
        const response = await request(app).post('/events').send(body)

        expect(response.status).toEqual(400)
        expect(response.body.message).toMatch('["lawfulBasis" must be one of [CONSENT, CONTRACT, LEGAL_OBLIGATION, VITAL_INTERESTS, PUBLIC_TASK, LEGITIMATE_INTERESTS]]')
      })
      it('triggers an event', async () => {
        await request(app).post('/events').send(body)

        expect(listener).toHaveBeenCalledWith(body.payload)
      })
    })
  })
})
