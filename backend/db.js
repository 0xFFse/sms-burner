"use-strict";
const logger = require('./logger.js');

const sqlite3 = require('sqlite3');
const sqlite = require('sqlite');
const escaperegexp = require('escape-string-regexp');

let db;
let cleanupTimer;

/**
 * We store the ts in seconds since 1/1 1970
 */
function now() {
    return Math.round(new Date().getTime() / 1000);
}

/**
 * Init the db
 */
exports.init = async (dbFile) => {
    if (db)
        await db.close();
    db = await sqlite.open({
        filename: dbFile,
        driver: sqlite3.cached.Database
    });
    logger.debug('opened db');

    // Try and populate DB tables to get started if the db file isn't there
    try {
        await db.run('CREATE TABLE Device(number TEXT NOT NULL PRIMARY KEY, ts INTEGER NOT NULL)');
        logger.info('created Device table');
    } catch (err) {
        if (!err.message || !err.message.includes("already exist"))
            throw err;
    }
    try {
        await db.run('CREATE TABLE Message(id INTEGER NOT NULL PRIMARY KEY, ts INTEGER NOT NULL, toNumber TEXT NOT NULL, fromNumber TEXT NOT NULL, msg TEXT NOT NULL)');
        logger.info('created Message table');
    } catch (err) {
        if (!err.message || !err.message.includes("already exist"))
            throw err;
    }
    try {
        await db.run('CREATE TABLE AbusePattern(pattern TEXT NOT NULL PRIMARY KEY, replacement TEXT, flags INT NOT NULL)');
        logger.info('created AbusePattern table');
    } catch (err) {
        if (!err.message || !err.message.includes("already exist"))
            throw err;
    }
    try {
        await db.run('CREATE TABLE AbuseReport(messageId INT NOT NULL, ip TEXT NOT NULL, ts INTEGER NOT NULL)');
        logger.info('created AbuseReport table');
    } catch (err) {
        if (!err.message || !err.message.includes("already exist"))
            throw err;
    }
}

async function cleanup() {
    if (cleanupTimer)
        clearTimeout(cleanupTimer);
    try {
        await db.run("DELETE FROM Device WHERE ts < ?", now() - 30 * 24 * 60);
        if (this.changes > 0) {
            logger.info('deleted ' + this.changes + ' old devices');
        }
    } catch (err) {
        logger.error('could not delete old devices: ' + err);
    }
    cleanupTimer = setTimeout(cleanup, 10 * 60000);
}
exports.cleanup = cleanup;

exports.getDevices = async function () {
    const rows = await db.all("SELECT number, ts FROM Device WHERE ts > ? ORDER BY ts DESC", now() - 10 * 60);
    return rows.map((r) => { return r.number; });
}

exports.getAbusePatterns = async function () {
    const rows = await db.all('SELECT pattern, replacement, flags FROM AbusePattern');
    const patterns = [];
    for (const row of rows) {
        // flag specifies handling and can be xor'ed together
        // 0x01 - only match pattern against sender phone number
        // 0x02 - remove message
        // 0x04 - mask matching part only
        if (row.flags & ~0x07 || (row.flags & 0x06) == 0x06 || (row.flags & 0x06) == 0)
            throw new Error("Invalid AbusePattern flags: " + row.flags);
        try {
            patterns.push({
                pattern: new RegExp(row.pattern, 'gim'),
                phoneOnly: ((row.flags & 0x01) != 0),
                remove: ((row.flags & 0x02) != 0),
                mask: ((row.flags & 0x04) != 0),
                replacement: row.replacement
            });
        } catch (err) {
            throw new Error('Invalid regexp "' + row.pattern + '": ' + err.message);
        }
    }
    return patterns.sort((a, b) => {
        a = (a.remove ? '0' : '1') + a.pattern.toString();
        b = (b.remove ? '0' : '1') + b.pattern.toString();
        return a.localeCompare(b);
    });
}

exports.reportAbuse = async function (id, ip) {
    const message = await db.get('SELECT id, ts, toNumber, fromNumber, msg FROM Message WHERE id=?', id);
    if (!message) {
        return null;
    }
    message.ts = new Date(message.ts * 1000);
    await db.run('INSERT INTO AbuseReport(messageId,ip,ts) VALUES(?,?,?)', id, ip, now());

    // since we need to get the count of reports per distinct ip we can't do a regular join in the initial query
    message.reports = await db.get('SELECT COUNT(*) AS total, COUNT(DISTINCT ip) AS sources FROM AbuseReport WHERE messageId=?', id);;
    return message;
}

exports.deleteMessage = async function (id, banNumber) {
    const msg = await db.get('SELECT fromNumber FROM Message WHERE id=?', id)
    if (banNumber && msg) {
        const pattern = escaperegexp(msg.fromNumber);
        await db.run("INSERT INTO AbusePattern(pattern,flags) VALUES(?,3) ON CONFLICT DO NOTHING", pattern);
    }
    await db.run('DELETE FROM Message WHERE id=?', id);
    return (msg ? msg.fromNumber : null);
}

exports.getMessage = async function (id) {
    const msg = await db.get('SELECT id, ts, toNumber, fromNumber, msg FROM Message WHERE id=?', id);
    if (msg)
        msg.ts = new Date(msg.ts * 1000);
    return msg;
}

exports.getMessages = async function (from, limit) {
    let messages;
    if (from)
        messages = await db.all('SELECT id, ts, toNumber, fromNumber, msg FROM Message WHERE id >= ? ORDER BY id DESC LIMIT ?', from, limit);
    else
        messages = await db.all('SELECT id, ts, toNumber, fromNumber, msg FROM Message ORDER BY id DESC LIMIT ?', limit);
    for (msg of messages)
        msg.ts = new Date(msg.ts * 1000);
    return messages;
}

exports.storeDevice = function (number) {
    return db.run("REPLACE INTO Device(number, ts) VALUES(?,?)", number, now());
}

exports.storeMessage = async function (to, from, msg) {
    const result = await db.run("INSERT INTO Message(ts, toNumber, fromNumber, msg) VALUES(?,?,?,?)", [now(), to, from, msg]);
    return result.lastID;
}

exports.close = async function () {
    if (cleanupTimer)
        clearTimeout(cleanupTimer);
    return db.close();
}


