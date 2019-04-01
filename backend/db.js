"use-strict";
const logger = require('./logger.js');

const sqlite3 = require('sqlite3');

var db;

/**
 * Init the db
 */
exports.init = function (dbFile, callback) {
    if (db)
        db.close();
    db = new sqlite3.Database(dbFile, (err) => {
        if (err) {
            logger.error('failed to open db: '+err);
            if (callback)
                callback(err);
        } else {
            logger.debug('opened db');

            // Try and populate DB tables to get started if the db file isn't there
            db.run('CREATE TABLE Device(number TEXT PRIMARY KEY, ts INTEGER NOT NULL)', (err) => {
                if (!err) {
                    logger.info('created Device table');
                }
                db.run('CREATE TABLE Message(id INTEGER PRIMARY_KEY, ts INTEGER NOT NULL, toNumber TEXT NOT NULL, fromNumber TEXT NOT NULL, fromName TEXT, msg TEXT NOT NULL)', (err) => {
                    if (!err) {
                        logger.info('created Message table');
                    }
                    if (callback)
                        callback();
                });
            });
        }
    });
}
exports.init('db/main.db');

function cleanup() {
    db.run("DELETE FROM Device WHERE ts < DATE('now','-30 days')", function(err) {
        if (err) {
            logger.error('could not delete old devices: '+err);
            return;
        }
        if (this.changes > 0) {
            logger.info('deleted '+this.changes+' old devices');
        }
    });
    /*
    db.run("UPDATE Message SET msg = '' WHERE ts < DATE('now','-7 days')", function(err) {
        if (err) {
            logger.error('could not delete old messages: '+err);
            return;
        }
        if (this.changes > 0) {
            logger.debug('deleted '+this.changes+' old messages');
        }
    });
    */
    timer = setTimeout(cleanup, 10*60000);
}
var timer = setTimeout(cleanup, 5000);

exports.getDevices = function(callback) {
    db.all("SELECT number, ts FROM Device WHERE ts > DATETIME('now', '-1 hours') ORDER BY DATETIME(ts) DESC", function(err, rows) {
        var devices;
        if (!err) {
            devices = [];
            for(var i=0; i<rows.length; i++)
                devices.push(rows[i].number);
        }
        callback(err, devices);
    });
}

exports.getMessages = function(callback) {
    db.all('SELECT ts, toNumber, fromNumber, fromName, msg FROM Message ORDER BY DATETIME(ts) DESC LIMIT 50', callback);
}

exports.storeDevice = function(number, callback) {
    db.run("REPLACE INTO Device(number, ts) VALUES(?,DATETIME('now'))", number, callback);
}

exports.storeMessage = function(to, from, fromName, msg, callback) {
    db.run("INSERT INTO Message(ts, toNumber, fromNumber, fromName, msg) VALUES(DATETIME('now'),?,?,?,?)", [to, from, fromName, msg], callback);
}

exports.close = function() {
    clearTimeout(timer);
    db.close();    
}


