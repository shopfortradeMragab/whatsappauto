const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode");
const fs = require("fs");
const config = JSON.parse(fs.readFileSync("./config.json"));

const clientsMap = new Map(); // clientId -> { client, qr }

function createClientInstance(clientId) {
  if (clientsMap.has(clientId)) return clientsMap.get(clientId).client;

  const client = new Client({
    puppeteer: {
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: config.headless,
    },
    authStrategy: new LocalAuth({ clientId }),
  });

  let qrCodeData = "";

  client.on("qr", async (qr) => {
    qrCodeData = await qrcode.toDataURL(qr);
    clientsMap.set(clientId, { client, qr: qrCodeData });
    console.log(`[${clientId}] QR generated`);
  });

  client.on("ready", () => {
    console.log(`[${clientId}] Client ready`);
  });

  client.on("message", async (message) => {
    console.log(`[${clientId}] Message from ${message.from}: ${message.body}`);
    if (config.autoReply) {
      setTimeout(() => {
        message.reply(config.replyMessage);
      }, config.messageDelay);
    }
  });

  client.on("disconnected", (reason) => {
    console.log(`[${clientId}] Disconnected:`, reason);
    clientsMap.delete(clientId);
  });

  client.initialize();
  clientsMap.set(clientId, { client, qr: qrCodeData });
  return client;
}

function generateClient(clientId) {
  console.log(`generateClient :${clientId}`);
  return createClientInstance(clientId);
}

function getQRCodeData(clientId) {
  const entry = clientsMap.get(clientId);
  return entry ? entry.qr : null;
}

module.exports = {
  generateClient,
  getQRCodeData,
  clientsMap,
};
