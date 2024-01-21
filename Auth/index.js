/**
 * @swagger
 * components:
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *   schemas:
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *     Success:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         result:
 *           type: object
 */

/**
 * @swagger
 * tags:
 *   name: JifunzeHub
 *   description: https://jifunze-hub.onrender.com
 */

/**
 * @swagger
 * /:
 *   get:
 *     summary: Welcome message
 *     tags: [JifunzeHub]
 *     responses:
 *       200:
 *         description: Welcome message
 */

/**
 * @swagger
 * /api-docs:
 *   get:
 *     summary: Swagger UI documentation
 *     tags: [JifunzeHub]
 *     responses:
 *       200:
 *         description: Swagger UI documentation page
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


require("dotenv").config();
const cors = require("cors");
const express = require("express");
const session = require("express-session");
const { v4 } = require("uuid");
const sql = require("mssql");
const config = require("./src/config/userConfig");
const RedisStore = require("connect-redis").default;
const { createClient } = require("redis");
const userRoutes = require("./src/routers/userRoutes");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");


async function startApp() {
  try {
    const app = express();
    // const pool = await sql.connect(config);

    // app.use((req, res, next) => {
    //   req.pool = pool;
    //   next();
    // });
    // console.log("App Connected to database");
    const options = {
      definition: {
        openapi: "3.0.0",
        info: {
          title: "Jifunze Hub API Documentation", 
          version: "1.0.0",
          description: "Documentation for Jifunze Hub API",
        },
      },
      apis: ["./src/routers/*.js"], 
    };
    const specs = swaggerJsdoc(options);

    // Serve Swagger UI
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

    const client = createClient({
      password: "FBaUqVovxxTpWnuCPtNkqM01vjCrzkUq",
      socket: {
        host: "redis-17901.c251.east-us-mz.azure.cloud.redislabs.com",
        port: 17901,
      },
    });
    client.connect();
    console.log("Connected to Redis");

    const redisStore = new RedisStore({
      client: client,
      prefix: "",
    });

    const oneDay = 60 * 60 * 1000 * 24;

    app.use(express.json());
    app.use(
      cors({
        origin: "https://jifunze-hub.onrender.com/",
        credentials: true,
        optionSuccessStatus: 200,
      })
    );

    app.set("trust proxy", 1);

    app.use(
      session({
        cookie: {
          secure: true,
          maxAge: 60000,
        },
        store: redisStore,
        secret: "secret",
        saveUninitialized: true,
        resave: false,
      })
    );

    app.use(function (req, res, next) {
      if (!req.session) {
        return next(new Error("Oh no")); //handle error
      }
      next(); //otherwise continue
    });

    // app.use(passport.initialize());
    // app.use(passport.session());
    // app.use((req, res, next) => {
    //   req.pool = pool;
    //   next();
    // });

    app.get("/", (req, res) => {
      res.send("Jifunze Hub");
    });

    app.use("/", userRoutes);

    app.get("/protected", (req, res) => {
      res.send("Hello!");
    });

    const port = process.env.PORT || 8080;
    app.listen(port, () => {
      console.log(`Server is listening at port ${port}`);
    });
  } catch (error) {
    console.log("Error connecting to database");
    console.log(error);
  }
}

startApp();
