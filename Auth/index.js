require("dotenv").config();
// require("../Auth/src/config/googleAuth");
const cors = require("cors");
const express = require("express");
const session = require("express-session");
const { v4 } = require("uuid");
const sql = require("mssql");
const config = require("./src/config/userConfig");
const RedisStore = require("connect-redis").default;
const { createClient } = require("redis");
const userRoutes = require("./src/routers/userRoutes");

const isLoggedIn = (req, res, next) => {
  req.user ? next() : res.sendStatus(401);
};

async function startApp() {
  try {
    const pool = await sql.connect(config);
    console.log("App Connected to database");

    const redisClient = createClient({
      password: '',
      socket: {
          host: 'redis-17901.c251.east-us-mz.azure.cloud.redislabs.com',
          port: 17901
      }
  });
    redisClient.connect();
    console.log("Connected to Redis");

    const redisStore = new RedisStore({
      client: redisClient,
      prefix: "",
    });

    const oneDay = 60 * 60 * 1000 * 24;

    const app = express();

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
          secure: false,
          domain: "https://jifunzehub-v1.azurewebsites.net/",
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

    // app.get(
    //   "/auth/google",
    //   passport.authenticate("google", { scope: ["email", "profile"] })
    // );

    // app.get("/google/callback", (req, res, next) => {
    //   passport.authenticate("google", {
    //     successRedirect: "/protected",
    //     failureRedirect: "/auth/failure",
    //   })(req, res, next);
    // });

    // app.get("/auth/failure", (req, res) => {
    //   res.send("Something went wrong on our end");
    // });

    // , isLoggedIn,
    app.get("/protected", (req, res) => {
      res.send("Hello!");
    });

    app.use("/", userRoutes);

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
