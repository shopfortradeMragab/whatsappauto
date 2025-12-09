const express = require("express");
const fs = require("fs");
const path = require("path");
const { generateClient, getQRCodeData } = require("./index");
const { initDB, getUserByName, addUser } = require("./sqlite");
const config = JSON.parse(fs.readFileSync("./config.json"));

const app = express();
app.use(express.static("public"));
app.use(express.json());
app.set("view engine", "ejs");

const clients = []; // list of logged-in clientIds
let dbInstance;

// Dashboard page
app.get("/", (req, res) => {
  res.render("index", { status: "Ready", messages: 0 });
});

// Client login
app.post("/api/login", (req, res) => {
  const { clientId, password } = req.body;
  console.log(clientId + password);
  let user = null;
  initDB().then((db) =>
    getUserByName(db, clientId).then((dbUser) => {
      if (dbUser && dbUser.password === password) {
        user = { clientId: dbUser.name, plan: "basic" }; // Assuming a default plan
        console.log(dbUser);
        clients.push(user);
        generateClient(user.clientId); // Generate a new client session
        // const user = users.users.find(
        //   (u) => u.clientId === clientId && u.password === password
        // );

        // if (user) {
        //   clients[clientId] = { connected: false, config: {}, plan: user.plan };
        res.json({ success: true, clientId, plan: user.plan });
      } else {
        res.json({ success: false, message: "Invalid credentials" });
      }
    })
  );
});

// Register new client
app.post("/api/register", (req, res) => {
  const { clientId, password, email } = req.body;
  try {
    let exists;
    getUserByName(dbInstance, clientId).then((dbUser) => {
      exists = dbUser ? true : false;
    });
    if (exists)
      return res.json({ success: false, message: "Client ID already exists" });
    addUser(dbInstance, clientId, password, email).then(() => {
      return res.json({ success: true, message: "Registration successful!" });
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ success: false, message: "Internal error" });
  }
});

app.get("/api/client/:id/config", (req, res) => {
  // simple in-memory config placeholder per client
  res.json({
    replyMessage: config.replyMessage,
    messageDelay: config.messageDelay,
    autoReply: config.autoReply,
  });
});

app.post("/api/client/:id/config", (req, res) => {
  // persist per-client config if needed (not implemented here)
  res.json({ success: true, message: "Config updated!" });
});

app.get("/api/status", (req, res) => {
  res.json({ status: "Connected", port: config.port, clients });
});

app.get("/api/qr/:clientId", (req, res) => {
  const qr = getQRCodeData(req.params.clientId);
  console.log(qr);
  if (qr) return res.json({ success: true, qr });
  return res.json({ success: false, message: "QR not ready" });
});

// start server after DB init
(async () => {
  try {
    dbInstance = await initDB();
    app.listen(config.port, () => {
      console.log(`Dashboard running on http://localhost:${config.port}`);
    });
  } catch (err) {
    console.error("Failed to initialize DB:", err);
    process.exit(1);
  }
})();

module.exports = { clients };
