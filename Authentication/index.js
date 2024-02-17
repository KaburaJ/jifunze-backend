const express = require("express");
const session = require("express-session");
const passport = require("passport");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const cors = require("cors");
const app = express();
const GoogleAuthRoutes = require("./src/routes/GoogleAuthRoutes"); // Assuming this is where your routes are defined
require("dotenv").config();

// CORS configuration
app.use(cors());

app.use(
  session({ 
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
  })
);
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

app.use("/", GoogleAuthRoutes);

const PORT = process.env.PORT || 2500; // Use the environment variable for port or default to 2500
app.listen(PORT, () => console.log(`App listening on port ${PORT}`));
