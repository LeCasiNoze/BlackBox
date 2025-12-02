const express = require("express");
const app = express();

// Route de test (page d'accueil)
app.get("/", (req, res) => {
  res.send("Hello from BlackBox on Render 🚀");
});

// Render te donne le port via process.env.PORT
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server listening on port " + PORT);
});
