const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const fs = require("fs");
const config = JSON.parse(fs.readFileSync("./config.json"));

const client = new Client({
  puppeteer: {
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: config.headless,
  },
  authStrategy: new LocalAuth({ clientId: "client-one" }),
});

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
  console.log("QR received, scan please!");
});

client.on("ready", () => {
  console.log("Client is ready!");
});

client.on("message", async (message) => {
  console.log(message.body);
  if (config.autoReply) {
    setTimeout(() => {
      message.reply(config.replyMessage);
    }, config.messageDelay);
  }
});

client.on("disconnected", (reason) => {
  console.log("Client was logged out", reason);
});

client.initialize();
