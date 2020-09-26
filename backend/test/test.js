"use strict";
const supertest = require("supertest");
const should = require('should');
const rewire = require('rewire');
const fs = require('fs');

const db = rewire('../db');
const app = rewire('../index');
//const server = supertest.agent(app.__get__('app'));
const server = supertest(app.__get__('app'));
const settings = app.__get__('settings')

const API_PREFIX = settings.URL_PREFIX;

function sleep(ms) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

describe("Static tests", function () {
    it("random 404", function (done) {
        server
            .get("/lkjsdflkjsdf")
            .expect(404)
            .end(function (err, res) {
                res.status.should.equal(404);
                done();
            });
    });
});


describe("API", function () {
    let rawDb;

    const getMessageFromDB = (id) => {
        return rawDb.get("SELECT * FROM Message WHERE ID=?", id);
    }

    const storeMessageInDB = async (msg) => {
        const res = await rawDb.run("INSERT INTO Message(id,ts,toNumber,fromNumber,msg) VALUES(?,?,?,?,?)", msg.id, msg.ts, msg.toNumber, msg.fromNumber, msg.msg);
        return res.lastID;
    }

    before(async () => {
        try {
            fs.unlinkSync('test/test.db');
        } catch (err) {
        }

        //monkeypatch the db
        await db.init('test/test.db');

        // add some abuse patterns to the test db
        rawDb = db.__get__('db');

        app.__set__("db", db);

        // set a dummy shared secret
        settings.sharedSecret = 'abcd';

        // create a 
    });
    after(async () => {
        await db.close();
        fs.unlinkSync('test/test.db');
    });

    beforeEach(async () => {
        const rateLimiter = app.__get__('rateLimiter');
        rateLimiter.delete('::ffff:127.0.0.1');
    })

    it("shall send 429 on too many request from same host", async () => {
        settings.REAL_IP_HEADER = undefined;
        let res;
        for (let i = 0; i < 100; i++) {
            res = await server
                .get(API_PREFIX + "/numbers");
            if (res.status == 429)
                break;
        }
        should.equal(res.status, 429);
    });

    it("shall send 429 on too many request from same host using ip header from proxy", async () => {
        settings.REAL_IP_HEADER = 'X-Real-IP';
        try {
            const headers = {};
            headers[settings.REAL_IP_HEADER] = '1.2.3.4';
            let res = await server.get(API_PREFIX + "/numbers").set(headers);
            should.equal(res.status, 200);
            for (let i = 0; i < 100; i++) {
                res = await server.get(API_PREFIX + "/numbers").set(headers);
                if (res.status == 429)
                    break;
            }
            should.equal(res.status, 429);
            headers[settings.REAL_IP_HEADER] = '1.2.3.5';
            res = await server.get(API_PREFIX + "/numbers").set(headers);
            should.equal(res.status, 200);
        } finally {
            settings.REAL_IP_HEADER = undefined;
        }
    });

    let number = "";
    for (let i = 0; i < 10; i++) {
        number += Math.floor(Math.random() * 10);
    }
    it("Add device", function (done) {
        server
            .post(API_PREFIX + "/device")
            .set('Content-Type', 'application/json')
            .send('{"number":"' + number + '","secret":"abcd"}')
            .expect(200)
            .end(function (err, res) {
                res.status.should.equal(200);
                done();
            });
    });

    it("Get numbers", function (done) {
        server
            .get(API_PREFIX + "/numbers")
            .expect(200)
            .end(function (err, res) {
                res.status.should.equal(200);
                res.body[0].should.equal(number);
                done();
            });
    });

    const number2 = "9" + number;
    it("Add device 2", function (done) {
        sleep(1000); //get a different timestamp for second device
        server
            .post(API_PREFIX + "/device")
            .set('Content-Type', 'application/json')
            .send('{"number":"' + number2 + '","secret":"abcd"}')
            .expect(200)
            .end(function (err, res) {
                res.status.should.equal(200);
                done();
            });
    });

    it("Get numbers", function (done) {
        server
            .get(API_PREFIX + "/numbers")
            .expect(200)
            .end(function (err, res) {
                res.status.should.equal(200);
                res.body[0].should.equal(number2);
                res.body[1].should.equal(number);
                done();
            });
    });

    it("Add device incorrect shared secret", function (done) {
        server
            .post(API_PREFIX + "/device")
            .set('Content-Type', 'application/json')
            .send('{"number":"123","secret":"123"}')
            .expect(403)
            .end(function (err, res) {
                res.status.should.equal(403);
                done();
            });
    });

    const msg1 = {
        toNumber: '+12345',
        fromNumber: '54321',
        msg: 'Test message 1'
    }
    let firstDate;
    it("Add message", function (done) {
        const data = JSON.parse(JSON.stringify(msg1));
        data.secret = 'abcd';
        server
            .post(API_PREFIX + "/message")
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(data))
            .expect(201)
            .end(function (err, res) {
                //BUGBUG: not guaranteed to be same hour
                firstDate = new Date();
                res.status.should.equal(201);
                done();
            });
    });


    const msg2 = {
        toNumber: '12345',
        fromNumber: '+54321',
        msg: 'Test message 2'
    }
    it("Add message 2", function (done) {
        sleep(1000);
        const data = JSON.parse(JSON.stringify(msg2));
        data.secret = 'abcd';
        server
            .post(API_PREFIX + "/message")
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(data))
            .expect(201)
            .end(function (err, res) {
                res.status.should.equal(201);
                done();
            });
    });

    it("Add message incorrect secret", function (done) {
        const data = JSON.parse(JSON.stringify(msg1));
        data.secret = '123';
        server
            .post(API_PREFIX + "/message")
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(data))
            .expect(403)
            .end(function (err, res) {
                res.status.should.equal(403);
                done();
            });
    });

    let messageId;
    it("Get messages", function (done) {
        server
            .get(API_PREFIX + "/messages")
            .expect(200)
            .end(function (err, res) {
                res.status.should.equal(200);
                let msg = res.body[0];
                messageId = msg.id;
                msg.fromNumber.should.equal(msg2.fromNumber);
                msg.toNumber.should.equal(msg2.toNumber);
                msg.msg.should.equal(msg2.msg);
                msg = res.body[1];
                msg.fromNumber.should.equal(msg1.fromNumber);
                msg.toNumber.should.equal(msg1.toNumber);
                msg.msg.should.equal(msg1.msg);
                done();
            });
    });

    it("shall return only last message", function (done) {
        should.exist(messageId);
        server
            .get(API_PREFIX + "/messages?from=" + messageId)
            .expect(200)
            .end(function (err, res) {
                res.status.should.equal(200);
                res.body.length.should.equal(1);
                let msg = res.body[0];
                msg.fromNumber.should.equal(msg2.fromNumber);
                msg.toNumber.should.equal(msg2.toNumber);
                msg.msg.should.equal(msg2.msg);
                done();
            });
    });

    it("Message timestamp", function (done) {
        server
            .get(API_PREFIX + "/messages")
            .expect(200)
            .end(function (err, res) {
                res.status.should.equal(200);
                const msg = res.body[0];
                msg.fromNumber.should.equal(msg2.fromNumber);
                msg.toNumber.should.equal(msg2.toNumber);
                msg.msg.should.equal(msg2.msg);
                const d1 = msg.ts.substring(0, msg.ts.indexOf(':'));
                const d2 = firstDate.toISOString().substring(0, firstDate.toISOString().indexOf(':'));
                d1.should.equal(d2);
                done();
            });
    });

    it("should throw exception on invalid abuse pattern regexp", async function () {
        let err;
        try {
            await rawDb.run("INSERT INTO AbusePattern VALUES('[', NULL, 0)");
            await db.getAbusePatterns();
        } catch (e) {
            err = e;
            await rawDb.run("DELETE FROM AbusePattern WHERE pattern='['");
        }
        should.exist(err);
    });

    it("should throw exception on invalid abuse pattern action", async function () {
        let err;
        try {
            await rawDb.run("INSERT INTO AbusePattern VALUES('grrrr', NULL, 8)");
            await db.getAbusePatterns();
        } catch (e) {
            err = e;
            await rawDb.run("DELETE FROM AbusePattern WHERE pattern='grrrr'");
        }
        should.exist(err);
    });

    it("should order abusepatterns in order remove, censor, mask", async function () {
        await rawDb.run("DELETE FROM AbusePattern");
        await rawDb.run("INSERT INTO AbusePattern VALUES('mask', NULL, 4)");
        await rawDb.run("INSERT INTO AbusePattern VALUES('remove', NULL, 2)");
        let patterns = await db.getAbusePatterns();
        patterns.length.should.equal(2);
        patterns[0].pattern.toString().includes('remove').should.be.true();
        patterns[1].pattern.toString().includes('mask').should.be.true();

        await rawDb.run("DELETE FROM AbusePattern");
        await rawDb.run("INSERT INTO AbusePattern VALUES('remove', NULL, 2)");
        await rawDb.run("INSERT INTO AbusePattern VALUES('mask', NULL, 4)");
        patterns = await db.getAbusePatterns();
        patterns.length.should.equal(2);
        patterns[0].pattern.toString().includes('remove').should.be.true();
        patterns[1].pattern.toString().includes('mask').should.be.true();
    });

    it("should censor abusive messages", async function () {
        // load the abuse patterns into the app
        await rawDb.run("DELETE FROM AbusePattern");
        await rawDb.run("INSERT INTO AbusePattern VALUES('badword', NULL, 2)");
        await rawDb.run("INSERT INTO AbusePattern VALUES('^1234567$', NULL, 3)");
        await rawDb.run("INSERT INTO AbusePattern VALUES('really\\W*bad', NULL, 2)");
        await rawDb.run("INSERT INTO AbusePattern VALUES('bad', 'XXX', 4)");
        const abusePatterns = await db.getAbusePatterns();
        app.__set__("abusePatterns", abusePatterns);


        await rawDb.run("DELETE FROM Message");

        const messages = [{
            toNumber: '12345',
            fromNumber: '+54321',
            msg: 'This is a BadWord that shall be removed'
        }, {
            toNumber: '23456',
            fromNumber: '1234567',
            msg: 'This message is from a bad phone number and shall be removed'
        }, {
            toNumber: '23456',
            fromNumber: '1234',
            msg: 'This message contains something really  bad and shall be removed'
        }, {
            toNumber: '23456',
            fromNumber: '1234',
            msg: 'This message contains something kinda bad and shall be masked'
        }, {
            toNumber: '23456',
            fromNumber: '1234',
            msg: 'This message is all ok'
        }];
        for (const msg of messages) {
            const data = JSON.parse(JSON.stringify(msg));
            data.secret = 'abcd';
            const res = await server
                .post(API_PREFIX + "/message")
                .set('Content-Type', 'application/json')
                .send(JSON.stringify(data))
                .expect(201);
            res.status.should.equal(201);
        }

        const res = await server
            .get(API_PREFIX + "/messages")
            .expect(200);
        res.status.should.equal(200);

        res.body.length.should.equal(2);

        let msg = res.body[0];
        msg.msg.should.equal('This message is all ok');

        msg = res.body[1];
        msg.msg.should.equal('This message contains something kinda XXX and shall be masked');
        messageId = msg.id;
    });

    it("should trigger the report script on abuse report", async function () {
        should.exist(messageId);
        settings.REPORT_SCRIPT = {
            command: 'bash',
            args: ['-c', 'cat - > test/report.json']
        }
        try {
            fs.unlinkSync('test/report.json');
        } catch (err) {
        }
        try {
            await server
                .get(API_PREFIX + '/message/' + messageId + '/report')
                .send()
                .expect(200);

            //BUGBUG: the server doesn't wait for script completion before sending a response so we wait some
            for (let i = 0; i < 100; i++) {
                if (fs.existsSync('test/report.json'))
                    break;
                await sleep(10);
            }

            fs.existsSync('test/report.json').should.equal(true);
            const data = fs.readFileSync('test/report.json');
            const reported = JSON.parse(data);
            should.exist(reported);
            should.exist(reported.id);
            reported.id.should.equal(messageId);
            should.exist(reported.reports);
            should.exist(reported.reports.total);
            should.exist(reported.reports.sources);
            reported.reports.total.should.equal(1);
            reported.reports.sources.should.equal(1);

        } finally {
            settings.REPORT_SCRIPT = undefined;
            try {
                fs.unlinkSync('test/report.json');
            } catch (err) {
            }
        }
    });

    it("should NOT delete message with invalid moderator password", async function () {
        await server
            .get(API_PREFIX + '/message/1/delete')
            .send()
            .expect(400);

        await server
            .get(API_PREFIX + '/message/1/delete?password=incorrect')
            .send()
            .expect(403);
    });

    it("should delete message with valid moderator password", async function () {
        let msg = { toNumber: '1234', fromNumber: '+999888777', msg: 'msg', ts: 123 };
        const id = await storeMessageInDB(msg);
        settings.moderatorPassword = '1234';
        await server
            .get(API_PREFIX + '/message/' + id + '/delete?password=1234&ban=true&confirm=true')
            .send()
            .expect(200);
        msg = await getMessageFromDB(id);
        should.not.exist(msg);
        const pattern = await rawDb.get('SELECT flags FROM AbusePattern WHERE pattern=?', '\\+999888777');
        should.exist(pattern);
        should.equal(pattern.flags, 3);
    });

});

