const express = require('express')
const next = require('next')
const csp = require('./csp.js')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

const port = parseInt(process.env.PORT, 10) || 3000

app.prepare()
.then(() => {
  const server = express()

  csp(server);
  server.get('*', (req, res) => {
    return handle(req, res)
  })

  server.listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on http://localhost:${port}`)
  })
})
.catch((ex) => {
  console.error(ex.stack)
  process.exit(1)
})
