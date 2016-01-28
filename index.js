// TECHNICAL DEBT!!!
// TODO remove when you figure out how to work with Foreman and node-debug locally
require('dotenv').config();

var express = require('express');
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var session = require('express-session')
var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser')
var methodOverride = require('method-override');
var request = require('request');
var crypto = require('crypto');

var app = express();
var server;

function allowInspection (req, res, next) {
    return next();
}

// TECHNICAL DEBT!!!
// TODO Reexamine whether this middleware -- which you copied from an example on the Passport site --
// is an appropriate way to handle redirection when an unathenticated user tries to access protected resources.
// What about the correct response header.
function ensureAuthenticated (req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }

    res.redirect('/welcome')
}

function initializeUser (accessToken, refreshToken, profile, done) {
    var admin = {
        user: process.env.COUCH_USERNAME,
        pass: process.env.COUCH_PASSWORD
    };
    var username = profile.id;
    var dbUrl = process.env.COUCH_URL + '/user_' + username;
    var urlFragments = dbUrl.split('://');
    var password;

    // Try to get the user.
    request.get({
        url: process.env.COUCH_URL +  '/_users/org.couchdb.user:' + username,
        auth: admin
    }, function (err, res) {
        var password;
        var cipher;

        if (err) return done(err);

        // User doesn't exist.
        if (res.statusCode === 404) {
            cipher = crypto.createCipher('aes192', process.env.COUCH_SECRET);
            password = accessToken.slice(-6);

            cipher.update(password);
 
            // Add the user
            request.put(
                {
                    url: process.env.COUCH_URL + '/_users/org.couchdb.user:' + username,
                    auth: admin,
                    json: true,
                    body: {
                        name: username,
                        password: password,
                        displayName: profile.displayName,
                        accessCode: cipher.final('hex'),
                        type: 'user',
                        roles: [ ]
                    }
                },
                function (err) {
                    if (err) return done(err);

                    // Add a db for the user.
                    request.put({ url: dbUrl, auth: admin }, function (err) {
                        if (err) return done(err);

                        // Add security settings to the db.
                        request.put(
                            {
                                url: dbUrl + '/_security',
                                auth: admin,
                                json: true,
                                body: {
                                    admins: {
                                        names: [ ],
                                        roles: [ ]
                                    },
                                    members: {
                                        names: [ profile.id ],
                                        roles: [ ]
                                    }
                                }
                            },
                            function (err) {
                                if (err) return done(err);

                                done(null, {
                                    url: [
                                        urlFragments.shift(),
                                        '://',
                                        username,
                                        ':',
                                        password,
                                        '@',
                                        urlFragments.shift()
                                    ].join('')
                                });
                            }
                        );
                    });
                }
            );
        } else {
            cipher = crypto.createDecipher('aes192', process.env.COUCH_SECRET);
            cipher.update(JSON.parse(res.body).accessCode, 'hex');

            password = cipher.final('utf8');
            
            done(null, {
                url: [
                    urlFragments.shift(),
                    '://',
                    username,
                    ':',
                    password,
                    '@',
                    urlFragments.shift()
                ].join('')
            });
        }
    });
}

passport.use(new FacebookStrategy(
    {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: 'http://localhost:3000/auth/facebook/callback'
    },
    initializeUser
));

//   Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete Facebook profile is serialized
//   and deserialized.
passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(obj, done) {
    done(null, obj);
}); 
    
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(cookieParser());
app.use(bodyParser.json());
app.use(methodOverride());
// TODO When in production, session needs a data store. 
app.use(session({
    secret: 'you better not tell',
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static('www'));

// A landing page with login and marketing info
app.get('/welcome', allowInspection, function (req, res) {
    res.render('welcome');
});

// TODO This URL should be passed via configuration when building the web app.
// Destroy the session, clear the cookie and redirect to the welcome page
app.get('/logout', function (req, res) {
    req.session.destroy(function () {
        res.clearCookie('connect.sid', { path: '/' });
        // TODO This redirect should force the cache to be overridden.
        res.redirect('/');
    });
});

// Initiates OAuth with Facebook API
app.get('/auth/facebook', allowInspection, passport.authenticate('facebook'));

// Called by Facebook after OAuth is complete
app.get('/auth/facebook/callback', allowInspection, passport.authenticate('facebook', {
    successRedirect: '/',
    failureRedirect: '/welcome'
}));

// Returns the desktop-app with user info
// TODO Ideally this would be cacheable to allow offline work with above caveat
// Would the combination of the right http header with the appropriate response code 
// do the trick for caching?
app.get('/', allowInspection, ensureAuthenticated, function (req, res) {
    res.render('index', {
        url: req.user.url
    });
});

server = app.listen(process.env.PORT || 3000);
