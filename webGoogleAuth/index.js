require("dotenv").config();
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const mssql = require('mssql');
const config = require('../webGoogleAuth/src/config/dbConfig')

const app = express();

// Session configuration
app.use(session({ 
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Google OAuth strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/google/callback",
    passReqToCallback: true
}, function(request, accessToken, refreshToken, profile, done) {
    const user = {
        firstName: profile.name.givenName,
        lastName: profile.name.familyName,
        email: profile.email 
    };

    return done(null, user);
}));

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});

// Routes
const GoogleAuthRoutes = require("./src/routes/GoogleAuthRoutes");
app.use('/', GoogleAuthRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
