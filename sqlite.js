// Install sqlite3 first:
// npm install sqlite3

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve('./db/whatsapp.db');

// Open or create database file
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to database at:', dbPath);
  }
});

// Helper: wrap db.run/db.get/db.all in Promises
function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this); // this.lastID, this.changes available
    });
  });
}

function getAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function allAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Initialize DB
async function initDB() {
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

  return db;
}

// Insert a user
async function addUser(name, password) {
  const result = await runAsync(
    `INSERT INTO users (name, password) VALUES (?, ?)`,
    [name, password]
  );
  console.log(`User : ${name} added with id ${result.lastID}`);
}

// Insert a message
async function addMessage(userId, receivemsg, sendmsg) {
  const result = await runAsync(
    `INSERT INTO messages (user_id, receivemsg, sendmsg) VALUES (?, ?, ?)`,
    [userId, receivemsg, sendmsg]
  );
  console.log(`Message logged with ID: ${result.lastID}`);
}

// Read users
async function getUsers() {
  return await allAsync(`SELECT * FROM users ORDER BY user_id ASC`);
}

async function getUserByName(userName) {
  const row = await getAsync(`SELECT * FROM users WHERE name = ?`, [userName]);
  console.log(row);
  return row;
}

async function getAllMessages(limit = 100) {
  return await allAsync(
    `SELECT m.*, u.name 
     FROM messages m 
     LEFT JOIN users u ON m.user_id = u.user_id 
     ORDER BY m.message_id DESC LIMIT ?`,
    [limit]
  );
}

async function getMessagesByUser(userId, limit = 100) {
  return await allAsync(
    `SELECT m.*, u.name 
     FROM messages m 
     LEFT JOIN users u ON m.user_id = u.user_id 
     WHERE m.user_id = ? 
     ORDER BY m.message_id DESC LIMIT ?`,
    [userId, limit]
  );
}

// Example usage
(async () => {
  await initDB();
  await addUser("Alice", "hashed_password_here");
  await addMessage(1, "receivemsg", "sendmsg");
  const users = await getUsers();
  console.log(users);
})();

module.exports = {
  initDB,
  addUser,
  addMessage,
  getUsers,
  getUserByName,
  getAllMessages,
  getMessagesByUser,
};