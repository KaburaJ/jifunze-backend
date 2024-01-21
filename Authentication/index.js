const express = require("express");
const session = require("express-session");
const passport = require("passport");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
require("./src/config/auth");
require("dotenv").config();
const GoogleAuthRoutes = require("./src/routes/GoogleAuthRoutes"); // Adjust the path

const app = express();
app.use(session({ secret: process.env.SECRET }));
app.use(passport.initialize());
app.use(passport.session());

// Swagger configuration
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Jifunze Hub API Documentation", // Adjust the title
      version: "1.0.0",
      description: "Documentation for Jifunze Hub API",
    },
  },
  apis: ["./src/routes/*.js"], // Specify the path to your route files using a wildcard
};
const specs = swaggerJsdoc(options);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

app.get("/", (req, res) => {
  res.send("Jifunze Hub");
});

app.use('/', GoogleAuthRoutes);

app.listen(5000, () => console.log("App listening on port 5000"));
