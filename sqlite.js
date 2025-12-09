const { DatabaseSync } = require("node:sqlite");
// Open or create database file
const db = new DatabaseSync("./db/whatsapp.db");
console.log(db.location());
async function initDB() {
  // Create Users table

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      password TEXT NOT NULL
    )
  `);
  // Create Messages table
  await db.exec(`
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
async function addUser(db, name, password) {
  const stmt = await db.prepare(
    `INSERT INTO users (name, password) VALUES (?, ?)`
  );
  const result = await stmt.run(name, password);
  console.log(`User : ${name} added`);
}
// Insert a message
async function addMessage(db, userId, receivemsg, sendmsg) {
  const stmt = await db.prepare(
    `INSERT INTO messages (user_id, receivemsg, sendmsg ) VALUES (?, ?, ?)`
  );
  const result = await stmt.run(userId, receivemsg, sendmsg);
  console.log(`Message logged with ID: ${result.lastInsertRowid}`);
}

// Added: read user(s) and read message(s)
async function getUsers(db) {
  const stmt = await db.prepare(`SELECT * FROM users ORDER BY user_id ASC`);
  const rows = await stmt.all();
  return rows;
}

async function getUserByName(db, userName) {
  console.log(`get user`);
  const stmt = await db.prepare(`SELECT * FROM users WHERE name = ?`);
  const row = await stmt.get(userName);
  console.log(row);
  return row;
}

async function getAllMessages(db, limit = 100) {
  const stmt = await db.prepare(
    `SELECT m.*, u.name FROM messages m LEFT JOIN users u ON m.user_id = u.user_id ORDER BY m.message_id DESC LIMIT ?`
  );
  const rows = await stmt.all(limit);
  return rows;
}

async function getMessagesByUser(db, userId, limit = 100) {
  const stmt = await db.prepare(
    `SELECT m.*, u.name FROM messages m LEFT JOIN users u ON m.user_id = u.user_id WHERE m.user_id = ? ORDER BY m.message_id DESC LIMIT ?`
  );
  const rows = await stmt.all(userId, limit);
  return rows;
}

// db.prepare().get().
// Example usage
// (async () => {
//   const db = await initDB();

//   await addUser(db, "Alice", "hashed_password_here");
//   await addMessage(db, 1, "receivemsg", "sendmsg");
//   await addMessage(db, 1, "send", "Hi there!");
// })();
// getUsers(db).then((users) => console.log(users));
module.exports = {
  initDB,
  addUser,
  addMessage,
  getUsers,
  getUserByName,
  getAllMessages,
  getMessagesByUser,
};
