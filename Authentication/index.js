const express = require("express");
const session = require("express-session");
const passport = require("passport");
require("../Authentication/auth");
require("dotenv").config();

const isLoggedIn = (req, res, next) => {
  req.user ? next() : res.sendStatus(401);
};

const app = express();
app.use(session({ secret: process.env.SECRET }));
app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => {
  res.send("Jifunze Hub");
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["email", "profile"] })
);

app.get("/google/callback", (req, res, next) => {
  passport.authenticate("google", {
    successRedirect: "/protected",
    failureRedirect: "/auth/failure",
  })(req, res, next);
});

app.get("/auth/failure", (req, res) => {
  res.send("Something went wrong on our end");
});

app.get("/protected", isLoggedIn, (req, res) => {
  res.send("Hello!");
});

app.listen(5000, () => console.log("App listening on port 5000"));
