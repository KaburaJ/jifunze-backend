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
 * /user/google/auth:
 *   post:
 *     summary: Register or Log In a new user using Google
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: User Google registration successful
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
 * /user/logout/{userId}:
 *   get:
 *     summary: Logout a user
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the user to logout
 *     responses:
 *       200:
 *         description: Logout successful
 *       500:
 *         description: Database connection error or internal server error
 */

const Joi = require("joi");
const bcrypt = require("bcrypt");
const mssql = require("mssql");
const { Connection } = require("tedious");
const userSchema = require("../validators/userRegistrationValidator");
const loginSchema = require("../validators/userLoginValidator");
const config = require("../config/userConfig");
const ejs = require("ejs");
const path = require("path");
const sendMail = require("../utils/authMail");
const jwt = require("jsonwebtoken");

const connection = new Connection(config);

connection.on("connect", function (err) {
  if (err) {
    console.error("Error connecting to the database:", err);
  } else {
    console.log("Connected to the database");
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
          .input("FirstName", user.FirstName)
          .input("LastName", user.LastName)
          .input("UserEmail", user.UserEmail)
          .input("UserPasswordHash", hashedPassword);

        const results = await request.execute("[dbo].[AddUser]");
        console.log("sdfghj", results);
        res.json(results.recordset[0]);

        console.log("CONNECTED AT SIGN UP");
        console.log("Received request body:", req.body);
        console.log("Hashed Password:", hashedPassword);
        console.log("Parameters sent to stored procedure:", {
          FirstName: user.FirstName,
          LastName: user.LastName,
          UserEmail: user.UserEmail,
          UserPasswordHash: hashedPassword,
        });
      }
    } catch (e) {
      console.error(e);
      res.status(500).send("An error occurred when registering a user");
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
        request.input("LoginUserEmail", user.UserEmail);

        const result = await request.execute("[dbo].[JifunzeUserLogin]");

        if (result.recordset.length > 0) {
          const dbPassword = result.recordset[0].UserPasswordHash;
          const passwordsMatch = await bcrypt.compare(
            user.UserPasswordHash,
            dbPassword
          );

          if (passwordsMatch) {
            const userId = result.recordset[0].UserID;
            const token = jwt.sign({ userId }, "coco", { expiresIn: "1y" });

            const updateRequest = new mssql.Request(sql);
            updateRequest.input("UserId", userId);
            updateRequest.input("Token", token);
            await updateRequest.query(
              "UPDATE [dbo].[Users] SET AuthToken = @token WHERE UserID = @UserId"
            );

            res.status(200).json({
              success: true,
              token: token,
              data: result.recordset,
            });
          } else {
            res.status(401).json({
              success: false,
              message: "Incorrect password",
            });
          }
        } else {
          res.status(404).json({ success: false, message: "No user found" });
        }
      } else {
        res
          .status(500)
          .json({ success: false, message: "Database connection error" });
      }
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ success: false, message: "Login error" });
    }
  },
  logoutUser: async (req, res) => {
    try {
      const userId = req.params.userId;

      const sql = await mssql.connect(config);
      if (sql.connected) {
        const request = new mssql.Request(sql);
        request.input("UserId", userId);
        await request.query(
          "UPDATE [dbo].[Users] SET AuthToken = NULL WHERE UserID = @UserId"
        );

        res.status(200).json({ success: true, message: "Logout successful" });
      } else {
        res
          .status(500)
          .json({ success: false, message: "Database connection error" });
      }
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ success: false, message: "Logout error" });
    }
  },
  registerOrLoginUser: async (req, res) => {
    try {
      const { FirstName, LastName, UserEmail, UserPasswordHash } = req.body;
  
      if (UserEmail && UserPasswordHash) {
        const sql = await mssql.connect(config);
        const checkEmailRequest = new mssql.Request(sql);
        checkEmailRequest.input("LoginUserEmail", UserEmail);
        const checkEmailResult = await checkEmailRequest.execute("[dbo].[JifunzeUserLogin]");
  
        if (checkEmailResult.recordset.length > 0) {
          const result = checkEmailResult.recordset[0];
          const dbPassword = result.UserPasswordHash;
  
          if (dbPassword) {
            const passwordsMatch = await bcrypt.compare(UserPasswordHash, dbPassword);
            if (passwordsMatch) {
              const userId = result.UserID;
              const token = jwt.sign({ userId }, "coco", { expiresIn: "1y" });
  
              const updateRequest = new mssql.Request(sql);
              updateRequest.input("UserId", userId);
              updateRequest.input("Token", token);
              await updateRequest.query("UPDATE [dbo].[Users] SET AuthToken = @token WHERE UserID = @UserId");
  
              res.status(200).json({ success: true, token: token, data: result });
            } else {
              res.status(401).json({ success: false, message: "Incorrect password" });
            }
          }
        } else {
          const hashedPassword = await bcrypt.hash(UserPasswordHash, 8);
          const registerRequest = new mssql.Request(sql);
          registerRequest.input("FirstName", FirstName);
          registerRequest.input("LastName", LastName);
          registerRequest.input("UserEmail", UserEmail);
          registerRequest.input("UserPasswordHash", hashedPassword);
          const registerResult = await registerRequest.execute("[dbo].[AddUser]");
  
          console.log("register result", registerResult);
          if(registerResult){
            const newUser = registerResult.recordset[0];
            const userId = newUser.UserID;
            const token = jwt.sign({ userId }, "coco", { expiresIn: "1y" });
    
            const updateRequest = new mssql.Request(sql);
            updateRequest.input("UserId", userId);
            updateRequest.input("Token", token);
            await updateRequest.query("UPDATE [dbo].[Users] SET AuthToken = @token WHERE UserID = @userId");
            res.status(200).json({ success: true, token: token, data: newUser });

          }
          
        }
      } else {
        res.status(400).json({ success: false, message: "UserEmail and UserPasswordHash are required" });
      }
    } catch (error) {
      console.error("Google registration or login error:", error);
      res.status(500).json({ success: false, message: "Google registration or login error" });
    }
  }  
}  