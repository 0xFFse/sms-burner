const helmet = require('helmet')
const uuidv4 = require('uuid/v4')

module.exports = function csp(app) {
  // Create a nonce on every request and make it available to other middleware
  app.use((req, res, next) => {
    res.locals.nonce = Buffer.from(uuidv4()).toString('base64')
    next()
  })

  const nonce = (req, res) => `'nonce-${res.locals.nonce}'`

  const scriptSrc = [nonce, "'self'"]

  const connectSrc = ["'self'"]
  // In dev we allow 'unsafe-eval', so HMR doesn't trigger the CSP
  if (process.env.NODE_ENV !== 'production') {
    scriptSrc.push("'unsafe-eval'")
    connectSrc.push("https://sms.0xff.se")
  }

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          baseUri: ["'none'"],
          objectSrc: ["'none'"],
          scriptSrc,
          connectSrc,
          styleSrc: ["'self'"]
        }
      }
    })
  )
}
