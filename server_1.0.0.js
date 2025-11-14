const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const config = JSON.parse(fs.readFileSync("./config.json"));

app.use(express.static("public"));
app.use(express.json());
app.set("view engine", "ejs");

// Dashboard page
app.get("/", (req, res) => {
  res.render("index", { status: "Ready", messages: 0 });
});

// API to update config
app.post("/api/config", (req, res) => {
  const updatedConfig = { ...config, ...req.body };
  fs.writeFileSync("./config.json", JSON.stringify(updatedConfig, null, 2));
  res.json({ success: true, message: "Config updated!" });
});

// API to get status
app.get("/api/status", (req, res) => {
  res.json({ status: "Connected", config });
});

app.listen(config.port, () => {
  console.log(`Dashboard running on http://localhost:${config.port}`);
});
