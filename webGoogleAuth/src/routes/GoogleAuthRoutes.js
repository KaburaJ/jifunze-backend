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

const express = require('express');
const GoogleAuthRoutes = express.Router();
const passport = require("passport");
const mssql = require('mssql');
const config = require('../config/dbConfig.js');

GoogleAuthRoutes.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["email", "profile"] })
);


GoogleAuthRoutes.get("/google/callback", async (req, res, next) => {
  passport.authenticate("google", async (err, user) => {
    console.log("User:", user);
    if (err || !user) {
      console.error("Authentication failed:", err);
      res.status(401).json({ success: false, message: 'Authentication failed' });
      return;
    }

    try {
      const sql = await mssql.connect(config);
      console.log("Connected to database");

      const request = new mssql.Request(sql);
      request.input('FirstName', user.FirstName);
      request.input('LastName', user.LastName);
      request.input('UserEmail', user.Email);
      request.input('UserPasswordHash', null);
      const result = await request.execute('[dbo].[AddUser]');
      console.log("SQL Query executed");

      if (result && result.rowsAffected && result.rowsAffected[0] > 0) {
        console.log("User added successfully");
        res.status(200).json({ success: true, message: 'User added successfully', user: result.recordset[0] });
      } else {
        console.error("Failed to add user to the database");
        res.status(500).json({ success: false, message: 'Failed to add user to the database' });
      }
    } catch (error) {
      console.error('Error adding user to the database:', error);
      res.status(500).json({ success: false, message: 'An error occurred while adding user to the database', error });
    }
  })(req, res, next);
});


GoogleAuthRoutes.get("/auth/failure", (req, res) => {
  res.send("Something went wrong on our end");
});

const isLoggedIn = (req, res, next) => {
  req.user ? next() : res.sendStatus(401);
};

GoogleAuthRoutes.get("/protected", isLoggedIn, (req, res) => {
  res.send("Hello!");
});

module.exports = GoogleAuthRoutes;
