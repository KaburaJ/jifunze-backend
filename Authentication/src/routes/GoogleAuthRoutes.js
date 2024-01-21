/**
 * @swagger
 * tags:
 *   name: GoogleAuth
 *   description: Google Authentication routes
 */

/**
 * @swagger
 * /auth/google:
 *   get:
 *     summary: Initiates Google OAuth authentication
 *     description: Redirects to Google OAuth for authentication
 *     responses:
 *       200:
 *         description: Successfully initiated OAuth
 */

const express = require('express');
const GoogleAuthRoutes = express.Router();
const passport = require("passport");

GoogleAuthRoutes.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["email", "profile"] })
);

/**
 * @swagger
 * /google/callback:
 *   get:
 *     summary: Handles Google OAuth callback
 *     description: Handles the callback from Google OAuth authentication
 *     responses:
 *       200:
 *         description: Successfully authenticated
 *       401:
 *         description: Authentication failed
 */
GoogleAuthRoutes.get("/google/callback", (req, res, next) => {
  passport.authenticate("google", {
    successRedirect: "/protected",
    failureRedirect: "/auth/failure",
  })(req, res, next);
});

/**
 * @swagger
 * /auth/failure:
 *   get:
 *     summary: Authentication failure
 *     description: Displays a message for authentication failure
 *     responses:
 *       200:
 *         description: Authentication failed
 */
GoogleAuthRoutes.get("/auth/failure", (req, res) => {
  res.send("Something went wrong on our end");
});

/**
 * @swagger
 * /protected:
 *   get:
 *     summary: Protected route
 *     description: Displays a message for authenticated users
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully authenticated
 *       401:
 *         description: Authentication failed
 */
const isLoggedIn = (req, res, next) => {
  req.user ? next() : res.sendStatus(401);
};

GoogleAuthRoutes.get("/protected", isLoggedIn, (req, res) => {
  res.send("Hello!");
});

module.exports = GoogleAuthRoutes;
