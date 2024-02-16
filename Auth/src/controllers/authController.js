/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         FirstName:
 *           type: string
 *         LastName:
 *           type: string
 *         UserEmail:
 *           type: string
 *         UserPasswordHash:
 *           type: string
 */

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and authorization
 */

/**
 * @swagger
 * /user/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: User registration successful
 *       400:
 *         description: Bad request or validation error
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /user/login:
 *   post:
 *     summary: Login a user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: User login successful
 *       400:
 *         description: Bad request or validation error
 *       401:
 *         description: Incorrect password
 *       404:
 *         description: No user found
 *       500:
 *         description: Internal server error
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


const Joi = require('joi');
const bcrypt = require('bcrypt');
const mssql = require('mssql');
const { Connection } = require('tedious');
const userSchema = require('../validators/userRegistrationValidator');
const loginSchema = require('../validators/userLoginValidator');
const config = require('../config/userConfig');
const ejs = require('ejs');
const path = require('path');
const sendMail = require('../utils/authMail')
const jwt = require('jsonwebtoken');


const connection = new Connection(config);

connection.on('connect', function (err) {
  if (err) {
    console.error('Error connecting to the database:', err);
  } else {
    console.log('Connected to the database');
  }
});

module.exports = {
  registerUser: async (req, res) => {
    console.log(process.env.DB_USER);
    try {
      const { error, value } = userSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const user = req.body;
      const hashedPassword = await bcrypt.hash(user.UserPasswordHash, 8);

      const sql = await mssql.connect(config);

      if (sql.connected) {
        const request = new mssql.Request(sql);
        request
          .input('FirstName', user.FirstName)
          .input('LastName', user.LastName)
          .input('UserEmail', user.UserEmail)
          .input('UserPasswordHash', hashedPassword);

        const results = await request.execute('[dbo].[AddUser]');
        res.json(results.recordset);

        console.log('CONNECTED AT SIGN UP');
        console.log('Received request body:', req.body);
        console.log('Hashed Password:', hashedPassword);
        console.log('Parameters sent to stored procedure:', {
          FirstName: user.FirstName,
          LastName: user.LastName,
          UserEmail: user.UserEmail,
          UserPasswordHash: hashedPassword,
        });

      }
    } catch (e) {
      console.error(e);
      res.status(500).send('An error occurred when registering a user');
    }
  },

loginUser: async (req, res) => {
    try {
        const { error, value } = loginSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const user = value;
        const sql = await mssql.connect(config);

        if (sql.connected) {
            const request = new mssql.Request(sql);
            request.input('LoginUserEmail', user.UserEmail);

            const result = await request.execute('[dbo].[JifunzeUserLogin]');

            if (result.recordset.length > 0) {
                const dbPassword = result.recordset[0].UserPasswordHash;
                const passwordsMatch = await bcrypt.compare(user.UserPasswordHash, dbPassword);

                if (passwordsMatch) {
                    const userId = result.recordset[0].UserId; 
                    const token = jwt.sign({ userId }, 'coco', { expiresIn: '1h' }); 

                    res.status(200).json({
                        success: true,
                        message: 'Logged in successfully',
                        token: token
                    });
                } else {
                    res.status(401).json({
                        success: false,
                        message: 'Incorrect password',
                    });
                }
            } else {
                res.status(404).json({ success: false, message: 'No user found' });
            }
        } else {
            res.status(500).json({ success: false, message: 'Database connection error' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Login error' });
    }
  }
}