const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode");
const fs = require("fs");
const config = JSON.parse(fs.readFileSync("./config.json"));

let qrCodeData = ""; // Store the QR code data

const client = new Client({
  puppeteer: {
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: config.headless,
  },
  authStrategy: new LocalAuth({ clientId: "client-one" }),
});

client.on("qr", async (qr) => {
  qrCodeData = await qrcode.toDataURL(qr); // Convert QR to a Data URL
  console.log("QR Code Data URL:", qrCodeData); // Log the QR code to the console
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

// Export a getter function for qrCodeData
module.exports = {
  getQRCodeData: () => qrCodeData,
};
