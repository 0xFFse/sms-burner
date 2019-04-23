"use strict";
const supertest = require("supertest");
const should = require("should");
const fs = require('fs');
const bcryptjs = require('bcryptjs');

const db = require('../db.js');
const {app, settings} = require('../index.js');
const server = supertest.agent(app);

const API_PREFIX = settings.URL_PREFIX;

function sleep(ms) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

describe("Static tests",function(){
    it("random 404",function(done){
        server
        .get("/lkjsdflkjsdf")
        .expect(404)
        .end(function(err,res){
            res.status.should.equal(404);
            done();
        });
    });
});

describe("API",function(){
    before((done) => {
        try {
            fs.unlinkSync('test/test.db');
        } catch (err) {            
        }
        db.init('test/test.db', (err) => {
            if (err) {
                console.error(err);
            }
            done();
        });
        settings.sharedSecretHash = bcryptjs.hashSync('abcd');
    });
    after(() => {
        db.close();
    });

    var number = "";
    for(var i=0; i<10; i++) {
        number += Math.floor(Math.random()*10);
    }
    it("Add device",function(done){
        server
        .post(API_PREFIX+"/device")
        .set('Content-Type', 'application/json')
        .send('{"number":"'+number+'","secret":"abcd"}')
        .expect(200)
        .end(function(err,res){
            res.status.should.equal(200);
            done();
        });
    });

    it("Get numbers",function(done){
        server
        .get(API_PREFIX+"/numbers")
        .expect(200)
        .end(function(err,res){            
            res.status.should.equal(200);
            res.body[0].should.equal(number);
            done();
        });
    });

    var number2 = "9"+number;
    it("Add device 2",function(done){
        sleep(1000); //get a different timestamp for second device
        server
        .post(API_PREFIX+"/device")
        .set('Content-Type', 'application/json')
        .send('{"number":"'+number2+'","secret":"abcd"}')
        .expect(200)
        .end(function(err,res){
            res.status.should.equal(200);
            done();
        });
    });

    it("Get numbers",function(done){
        server
        .get(API_PREFIX+"/numbers")
        .expect(200)
        .end(function(err,res){            
            res.status.should.equal(200);
            res.body[0].should.equal(number2);
            res.body[1].should.equal(number);
            done();
        });
    });

    it("Add device incorrect shared secret",function(done){
        server
        .post(API_PREFIX+"/device")
        .set('Content-Type', 'application/json')
        .send('{"number":"123","secret":"123"}')
        .expect(403)
        .end(function(err,res){
            res.status.should.equal(403);
            done();
        });
    });

    const msg1 = {
        toNumber: '+12345',
        fromNumber: '54321',
        msg: 'Test message 1'
    }
    var firstDate;
    it("Add message",function(done){
        var data = JSON.parse(JSON.stringify(msg1));
        data.secret = 'abcd';
        server
        .post(API_PREFIX+"/message")
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(data))
        .expect(201)
        .end(function(err,res){
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
    it("Add message 2",function(done){
        sleep(1000);
        var data = JSON.parse(JSON.stringify(msg2));
        data.secret = 'abcd';
        server
        .post(API_PREFIX+"/message")
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(data))
        .expect(201)
        .end(function(err,res){
            res.status.should.equal(201);
            done();
        });
    });

    it("Add message incorrect secret",function(done){
        var data = JSON.parse(JSON.stringify(msg1));
        data.secret = '123';
        server
        .post(API_PREFIX+"/message")
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(data))
        .expect(403)
        .end(function(err,res){
            res.status.should.equal(403);
            done();
        });
    });

    it("Get messages",function(done){
        server
        .get(API_PREFIX+"/messages")
        .expect(200)
        .end(function(err,res){            
            res.status.should.equal(200);
            var msg = res.body[0];
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

    it("Message timestamp",function(done){
        server
        .get(API_PREFIX+"/messages")
        .expect(200)
        .end(function(err,res){
            res.status.should.equal(200);
            var msg = res.body[0];
            msg.fromNumber.should.equal(msg2.fromNumber);
            msg.toNumber.should.equal(msg2.toNumber);
            msg.msg.should.equal(msg2.msg);
            var d1 = msg.ts.substring(0, msg.ts.indexOf(':'));
            var d2 = firstDate.toISOString().substring(0, firstDate.toISOString().indexOf(':'));
            d1.should.equal(d2);
            done();
        });
    });    
});

