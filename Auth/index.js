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

async function startApp() {
  try {
    const app = express();
    // const pool = await sql.connect(config);

    // app.use((req, res, next) => {
    //   req.pool = pool;
    //   next();
    // });
    // console.log("App Connected to database");

    const client = createClient({
      password: "FBaUqVovxxTpWnuCPtNkqM01vjCrzkUq",
      socket: {
        host: "redis://red-cmkldh21hbls73fqritg:6379",
        port: 6379,
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
        origin: "*",
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

    // const port = process.env.PORT || 8080;
    // app.listen(port, () => {
    //   console.log(`Server is listening at port ${port}`);
    // });
  } catch (error) {
    console.log("Error connecting to database");
    console.log(error);
  }
}

startApp();
