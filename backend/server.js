const express = require("express");

const app = express();

app.get("/", (req, res) => {
  res.send("StudyGarden API working 🌿");
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on", PORT);
});