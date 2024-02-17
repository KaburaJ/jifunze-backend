/**
 * @swagger
 * tags:
 *   name: GoogleAuth
 *   description: Google Authentication
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
 * /auth/failure:
 *   get:
 *     summary: Authentication failure
 *     description: Displays a message for authentication failure
 *     responses:
 *       200:
 *         description: Authentication failed
 */
const express = require('express');
const GoogleAuthRoutes = express.Router();
const passport = require("passport");
const mssql = require('mssql');
const config = require('../config/dbConfig.js')

GoogleAuthRoutes.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["email", "profile"] })
);

GoogleAuthRoutes.get("/auth/google/signup", async (req, res) => {
  const userData = req.body; // Assuming the user data is sent in the request body
  
  try {
    // Connect to the database
    const sql = await mssql.connect(config);

    // Call the stored procedure to add the user to the database
    const request = new mssql.Request(sql);
    request.input('FirstName', userData.FirstName);
    request.input('LastName', userData.LastName);
    request.input('UserEmail', userData.Email);
    request.input('UserPasswordHash', null); // Assuming password is handled securely within the mobile app
    const result = await request.execute('[dbo].[AddUser]');

    if (result && result.rowsAffected && result.rowsAffected[0] > 0) {
      res.status(200).json({ success: true, message: 'User added successfully', user: userData });
    } else {
      res.status(500).json({ success: false, message: 'Failed to add user to the database' });
    }
  } catch (error) {
    console.error('Error adding user to the database:', error);
    res.status(500).json({ success: false, message: 'An error occurred while adding user to the database' });
  }
});

GoogleAuthRoutes.get("/auth/failure", (req, res) => {
  res.send("Something went wrong on our end");
});

module.exports = GoogleAuthRoutes;
