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
  clientKey
}
const client = operator(config)
```