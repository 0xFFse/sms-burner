"use-strict";
// winston for logging
const winston = require('winston');
const settings = require(process.env.NODE_ENV === 'test' ? './settings-test.json' : './settings.json');

// set up logging
const logger = winston.createLogger({
    level: settings.loglevel,
    format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp({
                    format: 'YYYY-MM-DD HH:mm:ss'
                    }),
                    winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
    ),
    transports: [new winston.transports.Console()]  
});

module.exports = logger;

