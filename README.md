# mydata-operator-client
Client library for mydata operator

## Install
`npm install @mydata/operator-client`

## Create client
```javascript
const { readFileSync } = require('fs')
const operator = require('@mydata/operator-client')

const clientId = 'b311d654-6179-49f6-abc9-037ef758c6ef' // Application id, obtained by registering with Operator
const operatorUrl = 'https://smoothoperator.work' // URL of Operator
const clientKey = readFileSync('./keys/applicationPublicClientKey.pem', 'utf8') // Key for signing requests, counterpart of public key registered with operator
const config = {
  clientId,
  operatorUrl,
  clientKey,
  signKeyProvider: async () => {
    return readFileSync('./keys/applicationPublicSignKey.pem', 'utf8') // Signing keys might be appended over time
  },
  cryptKeyProvider: async () => {
    return readFileSync('./keys/applicationPublicSignKey.pem', 'utf8') // Encryption keys should be swapped out regularely
  }
}
const client = operator(config)
```

## Use client with express
```javascript
const express = require('express')
const app = express()

app.get('/jwks', client.routes.jwks())
app.get('/auth/callback', client.routes.callback())
```

## Request scopes

### User is not yet logged in
```javascript
const consentRequest = {
  education: {
    scopes: ['Read', 'Write'],
    reason: 'This service saves and retrieves information you enter about your education so we can build a CV'
  },
  experience: {
    scopes: ['Read'],
    source: 'linkedin.com',
    reason: 'Work experience is retrieved from Linkedin to build your CV'
  }
}
// This will redirect the user to the Operator auth page
client.requestConsents(consentRequest)
```
