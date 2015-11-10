var assert = require('assert');
var Waterline = require('waterline');
//var adapter = require('sails-memory');
var waterlineAdapter = require('sails-mongo');
var user = require('../models/user');

require('co-mocha');

describe('User Model', function () {
    var waterline = new Waterline();

    this.timeout(0);

    before(function (done) {
        waterline.loadCollection(Waterline.Collection.extend(user));

        waterline.initialize(
            {
                adapters: {
                    'test': waterlineAdapter
                },
                connections: {
                    default: {
                        adapter: 'test',
                        url: 'mongodb://toomanydaves:mLiaun.07@ds047514.mongolab.com:47514/youbetter_dev'
                    }
                }
            },
            function (err) {
                if (err) {
                    return done(err);
                }

                done();
            }
        );
    });

    after(function () {
        return new Promise(function (resolve) {
            waterlineAdapter.teardown(null, resolve);
        });
    });

/*
    it('should create a user', function *() {
        var user = new User();

        assert.equal(typeof user, 'object');
    });

    it('should store properties passed when instantiated', function *() {
        var userName = 'toomanydaves';
        var user = new User({ userName: userName });

        assert.equal(user.userName, userName);
    });
*/

    it('should create a user', function () {
        var User = waterline.collections.user;

        return User.create({
            firstName: 'Neil',
            lastName: 'Armstrong',
            password: 'secret'
        }).then(function (user) {
            assert.equal(user.firstName, 'Neil', 'should have set the first name');
            assert.equal(user.lastName, 'Armstrong', 'should have set the last name');
        });
    });
});
