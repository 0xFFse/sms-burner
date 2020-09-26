"use-strict";
const logger = require('./logger.js');

// express for http request handling
const express = require('express');

// body parser to parse post data
const bodyParser = require('body-parser');

// rate limiter to limit abuse of service like brute forcing secret
const { RateLimiterMemory } = require('rate-limiter-flexible');

// crypto for secure random
const crypto = require('crypto');

// spawn for notification script
const { spawn } = require('child_process');

// for html sanitization
const sanitize = require('sanitize-html');

// load settings
const settings = require(process.env.NODE_ENV === 'test' ? './settings-test.json' : './settings.json');

// get the db functionality
const db = require('./db.js')

// initialize express with bodyparser middleware
const app = express();
app.use(bodyParser.json({ inflate: false, limit: '2kb' }));

// add rate limiting, max 20 requests in 5 seconds then get banned for 30 seconds
const rateLimiter = new RateLimiterMemory({
    points: 20,
    duration: 5,
    blockDuration: 30
});
app.use((req, res, next) => {
    //rate limit per request IP
    rateLimiter.consume(getRealIp(req)).then(() => {
        next();
    }).catch(() => {
        res.status(429).send('Too many requests');
    });
});

// abuse patterns loaded from db
let abusePatterns = [];

// Get the real IP (check header if behind proxy)
function getRealIp(req) {
    if (settings.REALIP_HEADER) {
        const realIp = req.get(settings.REALIP_HEADER);
        if (realIp)
            return realIp;
        logger.warn("Request missing real IP header, falling back to real address.");
    }
    return req.connection.remoteAddress;
}

// async sleep function
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

// check the shared secret
async function validSecret(req) {
    if (!req.body || !req.body.secret) {
        logger.warn('Missing secret from ' + getRealIp(req));
        return false;
    }

    // add a random delay to make brute forcing the shared secret harder
    const buff = await crypto.randomBytes(2);
    const randomDelay = buff.readUInt16BE() % 500;
    await sleep(randomDelay + 1);

    if (settings.sharedSecret !== req.body.secret) {
        logger.warn('Invalid secret sent from ' + getRealIp(req));
        return false;
    }

    return true;
}

function filterMessage(msg) {
    for (const pattern of abusePatterns) {
        if (pattern.pattern.test(msg.fromNumber)) {
            if (pattern.remove)
                return null;
            if (pattern.mask)
                msg.fromNumber = msg.fromNumber.replace(pattern.pattern, (pattern.replacement ? pattern.replacement : 'XXXXX'));
        }
        if (!pattern.phoneOnly && pattern.pattern.test(msg.msg)) {
            if (pattern.remove)
                return null;
            if (pattern.mask) {
                msg.msg = msg.msg.replace(pattern.pattern, (pattern.replacement ? pattern.replacement : 'XXXXX'));
            }
        }
    }
    return msg;
}

/**
 * Receive message from SMS device
 */
app.post(settings.URL_PREFIX + '/message', async (req, res) => {
    if (!await validSecret(req)) {
        res.status(403).send('Forbidden');
        return;
    }
    // sanity check params, total size of body is limited in nginx
    if (!req.body.msg || (typeof req.body.msg) !== 'string' ||
        !req.body.toNumber || (typeof req.body.toNumber) !== 'string' ||
        !req.body.fromNumber || (typeof req.body.fromNumber) !== 'string') {
        logger.warn('Missing message params from ' + req.remoteAddress);
        res.status(400).send('Missing/invalid params');
        return;
    }

    // store data
    let fromNumber = req.body.fromNumber.trim();
    let message = req.body.msg.trim();
    let id;
    try {
        id = await db.storeMessage(req.body.toNumber, fromNumber, message);
    } catch (err) {
        logger.warn('Error from DB: ' + err);
        res.status(500).send('DB error');
        return;
    }
    logger.debug('Incoming message from ' + req.body.toNumber + ' at ' + req.connection.remoteAddress);
    res.status(201).send('Created');
});

/**
 * Register SMS device
 */
app.post(settings.URL_PREFIX + '/device', async (req, res) => {
    if (!await validSecret(req)) {
        res.status(403).send('Forbidden');
        return;
    }

    if (!req.body.number || (typeof req.body.number) !== 'string') {
        logger.warn('Missing device number from ' + getRealIp(req));
        res.status(400).send('Missing/invalid params');
        return;
    }

    // this will update the timestamp of the device
    try {
        await db.storeDevice(req.body.number);
    } catch (err) {
        logger.warn('Error from DB: ' + err);
        res.status(500).send('DB error');
        return;
    }
    logger.debug('Ping from ' + req.body.number + ' at ' + getRealIp(req));
    res.send('OK');
});

/**
 * Get numbers of all active sms devices
 */
app.get(settings.URL_PREFIX + '/numbers', async (req, res) => {
    let numbers;
    try {
        numbers = await db.getDevices();
    } catch (err) {
        logger.error('Error getting devices: ' + err);
        res.status(500).send('Could not get devices');
        return;
    }
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(numbers));
});

/**
 * Get all messages. Currently limited to the last 50 messages.
 */
app.get(settings.URL_PREFIX + '/messages', async (req, res) => {
    let from = req.query.from;
    if (from) {
        from = parseInt(from);
        if (isNaN(from)) {
            logger.warn('Invalid from id received from client: ' + from);
            res.status(400).send('Invalid from id');
            return;
        }
    }
    let messages;
    try {
        messages = await db.getMessages(from, 20);
    } catch (err) {
        logger.error('Error getting messages: ' + err);
        res.status(500).send('Could not get messages');
        return;
    }
    messages = messages.filter((msg) => {
        return (filterMessage(msg) != null);
    })
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(messages));
});

/**
 * Report a message
 */
app.get(settings.URL_PREFIX + '/message/:id/report', async (req, res) => {
    let id = parseInt(req.params.id);
    if (!isNaN(id)) {
        let message;
        try {
            message = await db.reportAbuse(id, getRealIp(req));
        } catch (err) {
            logger.error('Error getting message: ' + err);
            res.status(500).send('Could not get message');
            return;
        }
        if (message) {
            const json = JSON.stringify(message);
            logger.info('reporting message ' + id + ': ' + json);
            if (settings.REPORT_SCRIPT) {
                let ps;
                if (typeof (settings.REPORT_SCRIPT) === 'string')
                    ps = spawn(settings.REPORT_SCRIPT);
                else
                    ps = spawn(settings.REPORT_SCRIPT.command, settings.REPORT_SCRIPT.args, settings.REPORT_SCRIPT.options);
                ps.stderr.on('data', (data) => {
                    logger.warn("report-script: " + data);
                })
                ps.stdout.on('data', (data) => {
                    logger.debug("report-script: " + data);
                })
                ps.stdin.end(json, (err) => {
                    if (err)
                        logger.warn("Failed to write message to report script stdin: " + err);
                });
                ps.on('close', (code) => {
                    if (code)
                        logger.warn("report-script exited with exit code: " + code);
                })
            }
            res.status(200).send('Message reported');
            return;
        }
    }
    res.status(404).send('No such message');
});

/**
 * Delete/ban a message
 */
app.get(settings.URL_PREFIX + '/message/:id/delete', async (req, res) => {
    let id = parseInt(req.params.id);
    if (isNaN(id) || !req.query.password) {
        res.status(400).send('Missing/invalid parameters');
        return;
    }

    // add a random delay to make brute forcing the shared secret harder
    const buff = await crypto.randomBytes(2);
    const randomDelay = buff.readUInt16BE() % 500;
    await sleep(randomDelay + 1);

    if (!settings.moderatorPassword || settings.moderatorPassword !== req.query.password) {
        logger.warn('Invalid moderator password from ' + getRealIp(req));
        res.status(403).send('Access denied');
        return;
    }

    if (req.query.confirm && req.query.confirm === 'true') {
        const ban = (req.query.ban && req.query.ban === 'true');
        let deletedNumber;
        try {
            deletedNumber = await db.deleteReportedMessage(id, ban);
        } catch (err) {
            logger.error('Error deleting message: ' + err);
            res.status(500).send('Could not delete message');
            return;
        }
        if (ban) {
            // reload abuse patterns
            try {
                abusePatterns = await db.getAbusePatterns();
            } catch (err) {
                logger.error('Failed to reload abuse patterns: ' + err);
                res.status(500).send('Failed to reload abuse patterns');
                return;
            }
        }
        if (!deletedNumber) {
            res.status(404).send('No such message');
        } else {
            logger.info('Deleted message with id ' + id + ' from number ' + deletedNumber);
            res.status(200).send('Message deleted' + (ban ? ' and banned' : ''));
        }
        return;
    }

    let msg;
    try {
        msg = await db.getMessage(id);
    } catch (err) {
        logger.error('Error deleting message: ' + err);
        res.status(500).send('Could not delete message');
        return;
    }

    if (!msg) {
        res.status(404).send('Message not found');
        return;
    }

    res.status(200).send(
        'From: ' + sanitize(msg.fromNumber) + '<br/>' +
        'Time: ' + msg.ts.toISOString() + '<br/>' +
        'Message: ' + sanitize(msg.msg) + '<br/>&nbsp;<br/>' +
        '<a href="' + settings.URL_PREFIX + '/message/' + id + '/delete?confirm=true&password=' + encodeURIComponent(req.query.password) + '">Delete</a><br/>' +
        '<a href="' + settings.URL_PREFIX + '/message/' + id + '/delete?confirm=true&password=' + encodeURIComponent(req.query.password) + '&ban=true">Delete and ban number</a><br/>'
    );
});

/**
 * Reload abuse patterns
 */
app.get(settings.URL_PREFIX + '/reload', async (req, res) => {
    if (!req.query.password) {
        res.status(400).send('Missing/invalid parameters');
        return;
    }

    // add a random delay to make brute forcing the shared secret harder
    const buff = await crypto.randomBytes(2);
    const randomDelay = buff.readUInt16BE() % 500;
    await sleep(randomDelay + 1);

    if (!settings.moderatorPassword || settings.moderatorPassword !== req.query.password) {
        logger.warn('Invalid moderator password from ' + getRealIp(req));
        res.status(403).send('Access denied');
        return;
    }
    try {
        abusePatterns = await db.getAbusePatterns();
    } catch (err) {
        logger.error('Failed to reload abuse patterns: ' + err);
        res.status(500).send('Failed to reload abuse patterns');
        return;
    }
    res.status(200).send('OK');
});

/**
 * Die and roll over but don't tell what happened to the end user
 */
function errorHandler(err, req, res, next) {
    logger.error('Unhandled error: ' + err);
    res.status(500).send('error');
}
app.use(errorHandler);

async function init() {
    if (!settings.sharedSecret || settings.sharedSecret === 'changeme')
        throw new Error('shared secret is unsecure');
    if (settings.moderatorPassword === 'changeme')
        throw new Error('moderator password is unsecure');
    try {
        await db.init('db/main.db');
    } catch (err) {
        throw new Error('Failed to initialize db: ' + err);
    }
    try {
        abusePatterns = await db.getAbusePatterns();
    } catch (err) {
        throw new Error("Failed to load abuse pattern: " + err);
    }
    db.cleanup();
    app.listen(settings.port, settings.ip, () => {
        logger.info('Started sms service');
    });
}

//only listen if this is the main module (ie, not unit test)
if (!module.parent) {
    (async () => {
        try {
            await init();
        } catch (err) {
            logger.error(err);
            process.exit(-1);
        }
    })();
}
