// index.js
const app = require("./src/app");

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST;

if (HOST) {
  app.listen(PORT, HOST, () => {
    console.log(`Server listening on ${HOST}:${PORT}`);
  });
} else {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}
