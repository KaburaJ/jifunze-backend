const passport = require("passport");
require("dotenv").config();
const GoogleStrategy = require('passport-google-oauth2').Strategy;

const googleStrategy = new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  // clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "", // Set the callback URL to an empty string
  passReqToCallback: true
}, function(request, accessToken, refreshToken, profile, done) {
  const user = {
    FirstName: profile.name.givenName,
    LastName: profile.name.familyName,
    Email: profile.email
  };

  return done(null, user);
});

passport.use(googleStrategy);

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});
