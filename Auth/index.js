require("dotenv").config();
const cors = require("cors");
const express = require("express");
var session = require('cookie-session');
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
        password: 'FBaUqVovxxTpWnuCPtNkqM01vjCrzkUq',
        socket: {
            host: 'redis-17901.c251.east-us-mz.azure.cloud.redislabs.com',
            port: 17901
        }
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

    app.use(
      session({
        store: redisStore,
        secret: process.env.SECRET,
        saveUninitialized: false,
        genid: () => v4(),
        resave: false,
        rolling: true,
        unset: "destroy",
        cookie: {
          httpOnly: true,
          maxAge: oneDay,
          secure: true,
          domain: "*",
        },
      })
    );

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
