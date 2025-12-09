<<<<<<< HEAD
// index.js
const app = require("./src/app");

=======
const express = require("express");
const app = express();

// Route de test (page d'accueil)
app.get("/", (req, res) => {
  res.send("Hello from BlackBox on Render 🚀");
});

// Render te donne le port via process.env.PORT
>>>>>>> cdcc6e4 (Initial BlackBox backend)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server listening on port " + PORT);
});
