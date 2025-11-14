const { spawn } = require("child_process");
const path = require("path");

console.log("Starting WhatsApp Auto Bot...");

// Start server
const server = spawn("node", [path.join(__dirname, "server.js")], {
  stdio: "inherit",
  detached: false,
});

// Start bot
const bot = spawn("node", [path.join(__dirname, "index.js")], {
  stdio: "inherit",
  detached: false,
});

// Handle exit
process.on("exit", () => {
  server.kill();
  bot.kill();
});

server.on("error", (err) => console.error("Server error:", err));
bot.on("error", (err) => console.error("Bot error:", err));
