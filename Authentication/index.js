require("./src/config/auth");
require("dotenv").config();
const GoogleAuthRoutes = require("./src/routes/GoogleAuthRoutes");
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const cors = require("cors");
const app = express();

// CORS configuration
app.use(
  cors({
    origin: "https://jifunze-hub-google-signup.onrender.com",
    credentials: true,
    optionSuccessStatus: 200,
  })
);

// Session and Passport initialization
app.use(session({ secret: process.env.SECRET }));
app.use(express.json()); // Parse JSON bodies
app.use(passport.initialize());
app.use(passport.session());

// Swagger configuration
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Your API Documentation",
      version: "1.0.0",
      description: "Documentation for your API",
    },
  },
  apis: ["./src/routes/*.js"], // Specify the path to your route files
};
const specs = swaggerJsdoc(options);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

app.get("/", (req, res) => {
  res.send("Jifunze Hub");
});

app.use('/', GoogleAuthRoutes);

app.listen(5000, () => console.log("App listening on port 5000"));
