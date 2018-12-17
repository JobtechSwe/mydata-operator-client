# mydata-operator-client
Client library for mydata operator

## Install
`npm install @mydata/operator-client`

## Create client
```javascript
const { readFileSync } = require('fs')
const operator = require('@mydata/operator-client')

const config = {
  displayName: 'The name of your service',
  description: 'A nice description of your fantastic service'
  clientId: 'b311d654-6179-49f6-abc9-037ef758c6ef', // Application id, obtained by registering with Operator
  operatorUrl: 'https://smoothoperator.work', // URL of Operator
  clientKeys: {
    publicKey: '',
    privateKey: ''
  }
  jwksUrl: '/jwks'
}
const client = operator(config)
```

## Provide jwks route
```javascript
const express = require('express')
const app = express()

// Routes used by the operator
app.get('/jwks', client.routes.jwks)
app.post('/consents', client.routes.consents) // This url is currently hard coded, i.e. it has to be http://example.com/consents
```

## Subscribe to consent changes
```javascript
client.events.consents.on('consent', consent => {
  // store your consent here and take action (eg. redirect user)
})
```
