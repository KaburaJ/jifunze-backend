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
const router = express.Router();
const mssql = require('mssql');
const config = require('../config/dbConfig.js');
const { verifyGoogleToken } = require('../config/auth.js');

router.get(
  "/auth/google",
  (req, res, next) => {
    next()
  }
);

router.post("/google/callback", async (req, res, next) => {
  const { token } = req.body;

  try {
    const user = await verifyGoogleToken(token);

    // Connect to the database
    const sql = await mssql.connect(config);

    // Call the stored procedure to add the user to the database
    const request = new mssql.Request(sql);
    request.input('FirstName', user.FirstName);
    request.input('LastName', user.LastName);
    request.input('UserEmail', user.Email);
    request.input('UserPasswordHash', null);
    const result = await request.execute('[dbo].[AddUser]');

    if (result && result.rowsAffected && result.rowsAffected[0] > 0) {
      res.status(200).json({ success: true, message: 'User added successfully', user: user });
    } else {
      res.status(500).json({ success: false, message: 'Failed to add user to the database' });
    }
  } catch (error) {
    console.error('Error handling Google callback:', error);
    res.status(401).json({ success: false, message: 'Authentication failed' });
  }
});

router.get("/auth/failure", (req, res) => {
  res.send("Something went wrong on our end");
});

const isLoggedIn = (req, res, next) => {
  req.user ? next() : res.sendStatus(401);
};

router.get("/protected", isLoggedIn, (req, res) => {
  res.send("Hello!");
});

module.exports = router;
