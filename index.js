// import dependencies
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
// const bodyParser = require('body-parser');
// const formidable = require("express-formidable");

// set environnement variables
require("dotenv").config();
const app = express();

// Middleware pour parser le JSON
app.use(express.json());
// Middleware pour parser le corps des requêtes JSON
// app.use(bodyParser.json());

app.use(cors());
// app.use(formidable());

// connect to BDD
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  // useCreateIndex: true,
});

// connect to cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// import & use routes
// const userRoutes = require("./routes/User-routes.js");
const userRoutes = require("./routes/user");
app.use(userRoutes);

// const offerRoutes = require("./routes/Offer-routes.js");
const offerRoutes = require("./routes/offer.js");
app.use(offerRoutes);

const dataRoutes = require("./backend/routes/data.js");
app.use("/api", dataRoutes);


// Middleware de débogage
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.get("/", function (req, res) {
  res.send("Welcome to the Soukoni API.");
});

// app.post("/offer/publish", (req, res) => {
//   console.log("Bienvenue dans /offer/publish");
// });

// handle 404
app.all("*", (req, res) => {
  res.status(404).json({
    error: {
      message: "error 404 : page not found",
    },
  });
});

// start server
app.listen(process.env.PORT, () => {
  console.log("Server started, got get them Tiger ! 🐯");
});
