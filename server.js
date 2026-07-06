const express = require("express");
const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const { generateClient, getQRCodeData } = require("./index");
const config = JSON.parse(fs.readFileSync("./config.json"));

const app = express();
app.use(express.static("public"));
app.use(express.json());
app.set("view engine", "ejs");

const clients = []; // list of logged-in clientIds
let dbInstance;

// --- SQLite3 helpers ---
function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    dbInstance.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this); // this.lastID, this.changes
    });
  });
}

function getAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    dbInstance.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function allAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    dbInstance.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// --- DB functions ---
async function initDB() {
  const dbPath = path.resolve("./db/whatsapp.db");
  dbInstance = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error("Error opening DB:", err.message);
    else console.log("Connected to DB at:", dbPath);
  });

  await runAsync(`
    CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      password TEXT NOT NULL
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS messages (
      message_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      receivemsg TEXT NOT NULL,
      sendmsg TEXT NOT NULL
    )
  `);

  return dbInstance;
}

async function getUserByName(userName) {
  return await getAsync(`SELECT * FROM users WHERE name = ?`, [userName]);
}

async function addUser(name, password, email) {
  // email column not in schema, but you can add if needed
  return await runAsync(`INSERT INTO users (name, password) VALUES (?, ?)`, [
    name,
    password,
  ]);
}

// --- Express routes ---
app.get("/", (req, res) => {
  res.render("index", { status: "Ready", messages: 0 });
});

app.post("/api/login", async (req, res) => {
  const { clientId, password } = req.body;
  console.log(`client: ${clientId} password: ${password}`);

  try {
    const dbUser = await getUserByName(clientId);
    if (dbUser && dbUser.password === password) {
      const user = { clientId: dbUser.name, plan: "basic" };
      clients.push(user);
      generateClient(user.clientId);
      res.json({ success: true, clientId, plan: user.plan });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Internal error" });
  }
});

app.post("/api/register", async (req, res) => {
  const { clientId, password, email } = req.body;
  try {
    const dbUser = await getUserByName(clientId);
    if (dbUser) {
      return res.json({ success: false, message: "Client ID already exists" });
    }
    await addUser(clientId, password, email);
    return res.json({ success: true, message: "Registration successful!" });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ success: false, message: "Internal error" });
  }
});

app.get("/api/client/:id/config", (req, res) => {
  res.json({
    replyMessage: config.replyMessage,
    messageDelay: config.messageDelay,
    autoReply: config.autoReply,
  });
});

app.post("/api/client/:id/config", (req, res) => {
  res.json({ success: true, message: "Config updated!" });
});

app.get("/api/status", (req, res) => {
  res.json({ status: "Connected", port: config.port, clients });
});

app.get("/api/qr/:clientId", (req, res) => {
  const qr = getQRCodeData(req.params.clientId);
  if (qr) return res.json({ success: true, qr });
  return res.json({ success: false, message: "QR not ready" });
});

// --- Start server ---
(async () => {
  try {
    await initDB();
    app.listen(config.port, () => {
      console.log(`Dashboard running on http://localhost:${config.port}`);
    });
  } catch (err) {
    console.error("Failed to initialize DB:", err);
    process.exit(1);
  }
})();

module.exports = { clients };
