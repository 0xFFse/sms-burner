"use-strict";
// better logging
const winston = require('winston');

// load settings
const settings = require('./settings.json');

// use serial port
const SerialPort = require('serialport');

// library to decode PDU text message format
const PDU = require('node-pdu');

// library to send HTTP requests
const request = require('request');

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

// open the serial port with specified baudrate
const sp = new SerialPort(settings.serialport, {
	baudRate: settings.baudrate
});

// add a parser that reads complete lines (since we're doing AT-commands this is sufficient and convenient)
const Readline = SerialPort.parsers.Readline;
const parser = sp.pipe(new Readline({delimiter: '\r\n'}));

// if shit hits the fan, log it
sp.on('error', (err) => {
	logger.error('error: '+err);
});

function writeSerial(data) {
	sp.write(data);
}

// when the serial port is open we'll issue an AT command to check if the module is there
// we use ATE0 to disable echoing of the commands
function onSerialOpen() {
	logger.debug('port opened');
	writeSerial('ATE0\n');
}
sp.on('open', onSerialOpen);

// Function to notify the backend API that we are online and what number we have
function ping() {
	logger.debug('sending ping');
	try {
		request.post(settings.api+'/device',
			{ json: { number: settings.number, secret: settings.sharedSecret } },
			(err, res, body) => {
				if (err || res.statusCode !== 200) {
					logger.warn('could not ping: '+err);
					return;
				}
				logger.debug('pinged server');
			});
	} catch(err) {
		logger.error('ping threw exception: '+err);
	}
	// reschedule in 5 min
	setTimeout(ping, 5*60000);
}

function postMessageToApi(msg, retriesLeft = 3) {
	request.post(settings.api+'/message',
		{ json: { toNumber: settings.number, fromNumber: msg.getAddress().getPhone(), msg: msg.getData().getText(), secret: settings.sharedSecret } },
		(err, res, body) => {
			if (err || res.statusCode !== 201) {
				logger.warn('could send message to service: '+err);
				if (--retriesLeft > 0) {
					log.debug('scheduling retry');
					setTimeout(() => {
						postMessageToApi(msg, retriestLeft);
					}, 10*1000);
				}
				return;
			}
			logger.debug('sent message to service');
		});
}

var pendingMessages = new Map();

class ConcatinatedSMS {
    constructor() {
        this.ts = new Date();
        this.parts = new Map();    
    }
}

function decode(pdu) {
    var msg = PDU.parse(pdu);

    var parts = msg.getParts();
    if (parts.length > 0) {
        if (parts.length > 1) {
			//TODO: Better handling of multi-part messages
            logger.warn('more than 1 part: '+pdu);
		}
		
        var header = parts[0].getHeader();
        if (header) {
            if (header.getSegments() > 1) {
                //concatenated SMS (multi-message)
                var key = msg.getAddress().getPhone()+':'+header.getPointer();
                var obj = pendingMessages.get(key);
                if (!obj) {
					obj = new ConcatinatedSMS();
					pendingMessages.set(key, obj);
					logger.debug('creating concatinated sms '+key);
					obj.timer = setTimeout(() => {
						logger.info('deleting incomplete concatinated sms '+key);
						pendingMessages.delete(key);
					}, settings.concatedSMSTimeout);
                }
                obj.parts.set(key+header.getCurrent(), msg.getData());
				logger.debug('received concatenated sms '+key+' part '+header.getCurrent()+'/'+header.getSegments());
                if (obj.parts.size === header.getSegments()) {
					// we hopefully got all parts, lets try and decode
					clearTimeout(obj.timer);
					pendingMessages.delete(key);
                    var d = msg.getData();
                    for(const v of obj.parts.values()) {
                        d.append(v);
					}
					logger.debug('received all parts of concatenated sms '+key);
					return msg;
                } else {
					return null;
				}
            }      
        } else {
			return msg;
        }
    } else {
        logger.warn('0 part msg: '+pdu);
		return msg;
    }
}

function onSerialData(data) {
	//trim whitespace off data
	data = new String(data).trim();
	logger.debug('got data: '+data);
	switch(state) {
	case 0:
		// until we have turned off AT-echo we might get the ATE0 command echoed back to us
		if (data === 'ATE0') {
			return;
		}
		if (data !== 'OK') {
			logger.error('could not init module: '+data);
			return;
		}
		logger.debug('init state 1 completed');
		state++;

		//configure PDU-mode instead of TXT mode to support multiline text messages etc
		writeSerial('AT+CMGF=0\n');		
		break;

	case 1:
		if (data !== 'OK') {
			logger.error('could not set PDU mode: '+data);
			return;
		}
		logger.debug('init state 2 completed');
		state++;

		// set up notification of incoming messages. We think this are good settings but the 
		// instructions are not extremely clear
		writeSerial('AT+CNMI=3,2\n');
		break;

	case 2:
		if (data !== 'OK') {
			logger.error('could not set sms notification mode: '+data);
			return;
		}
		// we have successfully inited the module and are ready to go, start ping the server
		ping();
		logger.info('fully initialized');
		state = 3;
		break;

	case 3:
		// we have received a new text message
		if (!data.startsWith('+CMT:')) {
			logger.warn('ignoring unknown data: '+data.trim());
			return;
		}

		logger.debug('received SMS header: '+data.trim());
		state = 4;
		break;

	case 4:
		logger.debug('received SMS data: '+data.trim());

		try {
			//parse the PDU message (basically a hex-encoding of the number and message but there was a library so yeah)
			var msg = decode(data.trim());
			if (msg) {
				logger.info('received sms from : '+msg.getAddress().getPhone());
				postMessageToApi(msg);
			}
			
			
		} catch(err) {
			logger.warn('error parsing sms: '+err);
		}

		//go back to listening for incoming messages state
		state = 3;
		break;
	}	
}

// This is the callback when we get data on the serial and it become our main message loop
// We use a very simple state machine to track initialization of the module
var state = 0;
parser.on('data', onSerialData);

sp.on('close', () => {
	logger.warn('port closed');
});

logger.info('starting');

