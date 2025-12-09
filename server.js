const express = require("express");
const fs = require("fs");
const path = require("path");
require("./index"); // Ensure index.js runs in the same process
const { getQRCodeData, generateClient } = require("./index"); // Import the getter function
const { initDB, getUserByName } = require("./sqlite");
const { generate } = require("qrcode-terminal");
const config = JSON.parse(fs.readFileSync("./config.json"));
// const users = JSON.parse(fs.readFileSync("./users.json"));
// require("./sqlite");

const app = express();
app.use(express.static("public"));
app.use(express.json());
app.set("view engine", "ejs");

// Store client sessions
const clients = [];
const db = initDB();

// Dashboard page
app.get("/", (req, res) => {
  res.render("index", { status: "Ready", messages: 0 });
});

// Client login
app.post("/api/login", (req, res) => {
  const { clientId, password } = req.body;
  let user = null;
  db.then((db) =>
    getUserByName(db, clientId).then((dbUser) => {
      if (dbUser && dbUser.password === password) {
        user = { clientId: dbUser.name, plan: "basic" }; // Assuming a default plan
        clients.push(user);
        generateClient(); // Generate a new client session
      }
      // const user = users.users.find(
      //   (u) => u.clientId === clientId && u.password === password
      // );

      // if (user) {
      //   clients[clientId] = { connected: false, config: {}, plan: user.plan };
      //   res.json({ success: true, clientId, plan: user.plan });}
      else {
        res.json({ success: false, message: "Invalid credentials" });
      }
    })
  );
});

// Register new client
app.post("/api/register", (req, res) => {
  const { clientId, password, email } = req.body;
  const existingUser = users.users.find((u) => u.clientId === clientId);

  if (existingUser) {
    res.json({ success: false, message: "Client ID already exists" });
    return;
  }

  const newUser = { clientId, password, email, plan: "basic" };
  users.users.push(newUser);
  fs.writeFileSync("./users.json", JSON.stringify(users, null, 2));

  res.json({ success: true, message: "Registration successful!" });
});

// Get client config
app.get("/api/client/:id/config", (req, res) => {
  const clientConfig = clients[req.params.id]?.config || {};
  res.json(clientConfig);
});

// Update client config
app.post("/api/client/:id/config", (req, res) => {
  if (!clients[req.params.id]) {
    clients[req.params.id] = { connected: false, config: {} };
  }
  clients[req.params.id].config = req.body;
  res.json({ success: true, message: "Config updated!" });
});

// Get status
app.get("/api/status", (req, res) => {
  res.json({ status: "Connected", config });
});

// Update global config
app.post("/api/config", (req, res) => {
  const updatedConfig = { ...config, ...req.body };
  fs.writeFileSync("./config.json", JSON.stringify(updatedConfig, null, 2));
  res.json({ success: true, message: "Config updated!" });
});

// Get subscription plans
app.get("/api/plans", (req, res) => {
  res.json({
    plans: {
      basic: { price: 9.99, messages: 100 },
      pro: { price: 29.99, messages: 1000 },
      enterprise: { price: 99.99, messages: "unlimited" },
    },
  });
});

// Serve the QR code
app.get("/api/qr", (req, res) => {
  const qrCodeData = getQRCodeData(); // Get the latest QR code data
  if (qrCodeData) {
    res.json({ success: true, qrCode: qrCodeData });
  } else {
    res.json({ success: false, message: "QR code not available yet." });
  }
});

app.listen(config.port, () => {
  console.log(`Dashboard running on http://localhost:${config.port}`);
});
module.exports = { clients };
