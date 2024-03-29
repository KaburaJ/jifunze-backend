const passport = require("passport");
require("dotenv").config();
const GoogleStrategy = require('passport-google-oauth2').Strategy;

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://jifunze-hub-google-signup.onrender.com/google/callback",
    passReqToCallback: true
}, function(request, accessToken, refreshToken, profile, done) {
    const user = {
        FirstName: profile.name.givenName,
        LastName: profile.name.familyName,
        Email: profile.email 
    };

    return done(null, user);
}));

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});
