"use-strict";
const logger = require('./logger.js');

// express for http request handling
const express = require('express');

// body parser to parse post data
const bodyParser = require('body-parser');

// bcrypt for secret hash
const bcryptjs = require('bcryptjs');

// rate limiter to limit abuse of service like brute forcing secret
const { RateLimiterMemory } = require('rate-limiter-flexible');

const settings = require(process.env.NODE_ENV === 'test' ? './settings-test.json' : './settings.json');


// get the db functionality
const db = require('./db.js')

// initialize express with bodyparser middleware
const app = express();
app.use(bodyParser.json({inflate: false, limit: '2kb'}));

// add rate limiting, max 20 requests in 5 seconds then get banned for 30 seconds
const rateLimiter = new RateLimiterMemory({
    points: 20,
    duration: 5,
    blockDuration: 30
});
app.use((req, res, next) => {
    //rate limit per request IP
    //NOTE: We are using an Nginx to forward requests to the API, hence we cannot check
    //   the req.connection.remoteAddress but instead have to use the X-Real-IP header
    //   that we add in nginx. If you're not forwarding this request an attacker can just
    //   send a unique X-Real-IP header to circumvent our rate limiting.
    var realIp = req.get('X-Real-IP');
    rateLimiter.consume(realIp ? realIp : req.connection.remoteAddress).then(() => {
        next();
    }).catch(() => {
        res.status(429).send('Too many requests');
    });
});

// check the secret using bcrypt
function checkSecret(req, res, callback) {
    if (!req.body || !req.body.secret) {
        callback('Missing secret');
        return;
    }
    bcryptjs.compare(req.body.secret, settings.sharedSecretHash, (err, result) => {
        if (err || !result) {
            logger.warn('Invalid secret sent from '+req.remoteAddress);
            callback('Invalid secret');
            return;
        }
        callback();
    });
}

/**
 * Receive message from SMS device
 */
app.post(settings.URL_PREFIX+'/message', (req, res) => {
    checkSecret(req, res, (err) => {
        if (err) {
            res.status(403).send('Forbidden');
            return;
        }

        // sanity check params, total size of body is limited in nginx
        if (!req.body.msg || (typeof req.body.msg) !== 'string' ||
            !req.body.toNumber || (typeof req.body.toNumber) !== 'string' ||
            !req.body.fromNumber || (typeof req.body.fromNumber) !== 'string') {
            logger.warn('Missing message params from '+req.remoteAddress);
            res.status(400).send('Missing/invalid params');
            return;
        }

        // store data
        db.storeMessage(req.body.toNumber, req.body.fromNumber, null, req.body.msg, (err) => {
            if (err) {
                logger.warn('Error from DB: '+err);
                res.status(500).send('DB error');
                return;
            }
            logger.debug('Incoming message from '+req.body.toNumber+' at '+req.connection.remoteAddress);
            res.status(201).send('Created');
        });

    });
});

/**
 * Register SMS device
 */
app.post(settings.URL_PREFIX+'/device', (req, res) => {
    checkSecret(req, res, (err) => {
        if (err) {
            res.status(403).send('Forbidden');
            return;
        }
        if (!req.body.number || (typeof req.body.number) !== 'string') {
            logger.warn('Missing device number from '+req.connection.remoteAddress);
            res.status(400).send('Missing/invalid params');
            return;
        }

        // this will update the timestamp of the device
        db.storeDevice(req.body.number, (err) => {
            if (err) {
                logger.warn('Error from DB: '+err);
                res.status(500).send('DB error');
                return;
            }
            logger.debug('Ping from '+req.body.number+' at '+req.connection.remoteAddress);
            res.send('OK');
        });
    });
});

/**
 * Get numbers of all active sms devices
 */
app.get(settings.URL_PREFIX+'/numbers', (req, res) => {
    db.getDevices((err, numbers) => {
        if (err) {
            logger.error('Error getting devices: '+err);
            res.status(500).send('Could not get devices');
            return;
        }
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(numbers));
    });
});

/**
 * Get all messages. Currently limited to the last 50 messages.
 */
app.get(settings.URL_PREFIX+'/messages', (req, res) => {
    db.getMessages((err, messages) => {
        if (err) {
            logger.error('Error getting messages: '+err);
            res.status(500).send('Could not get messages');
            return;
        }
        messages.forEach((v) => {
            // sqlite3 stores ts in UTC without T/Z-letters
            v.ts = v.ts.replace(' ','T')+'Z';
        })
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(messages));    
    });
});

/**
 * Die and roll over but don't tell what happened to the end user
 */
function errorHandler (err, req, res, next) {
    logger.error('Unhandled error: '+err);
    res.status(500).send('error');    
}
app.use(errorHandler);

//only listen if this is the main module (ie, not unit test)
if (!module.parent) {
    if (settings.sharedSecretHash === 'changeme') {
        logger.error('shared secret is unsecure');
        process.exit(-1);
    }
    app.listen(settings.port, () => {
        logger.info('Started sms service');
    });
}

module.exports.app = app;
module.exports.settings = settings;
