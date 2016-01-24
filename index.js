var express = require('express');
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var session = require('express-session')
var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser')
var methodOverride = require('method-override');

var app = express();

function ensureAuthenticated (req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }

    res.redirect('/welcome')
}

passport.use(new FacebookStrategy(
    {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: 'http://youbetter.today/auth/facebook/callback'
    },
    function (accessToken, refreshToken, profile, done) {
        /*
        User.findOrCreate(..., function(err, user) {
            if (err) { return done(err); }
            done(null, user);
        });
        */

       //  In a typical application, you would want
       //  to associate the Facebook account with a user record in your database,
       //  and return that user instead.
       return done(null, profile);
    }
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
app.use(bodyParser());
app.use(methodOverride());
app.use(session({ secret: 'you better not tell' }));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static('www'));

app .get('auth/facebook/callback', passport.authenticate('facebook', {
    successRedirect: '/',
    failureRedirect: '/welcome'
}));

app.get('auth/facebook', passport.authenticate('facebook'));

app.get('welcome', function (req, res) {
    res.render('welcome');
});

app.get('/', ensureAuthenticated, function (req, res) {
    res.render('index', { user: req.user });
});

app.listen(process.env.PORT || 3000);
