/**
 * @swagger
 * tags:
 *   name: GoogleAuth
 *   description: https://jifunze-hub-google-signup.onrender.com
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
GoogleAuthRoutes.get("/google/callback", async (req, res, next) => {
  passport.authenticate("google", async (err, user) => {
    if (err || !user) {
      res.redirect("/auth/failure");
      return;
    }

    try {
      const sql = await mssql.connect(config);
      const request = new mssql.Request(sql);
      request.input('FirstName', user.FirstName); 
      request.input('LastName', user.LastName);
      request.input('UserEmail', user.Email);
      request.input('UserPasswordHash', null);

      const result = await request.execute('[dbo].[JifunzeAddUser]');

      if (result && result.rowsAffected && result.rowsAffected[0] > 0) {
        res.status(200).json({
          success: true,
          message: 'User added and logged in successfully',
          user: user 
        });
      } else {
        res.redirect("/auth/failure");
      }
    } catch (error) {
      console.error('Error adding user to database:', error);
      res.redirect("/auth/failure");
    }
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
