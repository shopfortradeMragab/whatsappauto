const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode");
const fs = require("fs");
const config = JSON.parse(fs.readFileSync("./config.json"));

const clientsMap = new Map(); // clientId -> { client, qr }

/**
 * Creates a WhatsApp client instance for the given client ID.
 * If the client ID already exists in the clients map, returns the existing client.
 * Otherwise, creates a new client instance and initializes it.
 * @param {string} clientId - The unique client ID.
 * @returns {Client} - The WhatsApp client instance.
 */

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
    // Convert the QR code to a Data URL
    // This is necessary as the QR code is generated as a PNG image
    // and we need to store it as a string in the clients map
    const qrCodeBuffer = await qrcode.toBuffer(qr);
    const qrCodeBase64 = qrCodeBuffer.toString("base64");
    qrCodeData = `data:image/png;base64,${qrCodeBase64}`;
    clientsMap.set(clientId, { client, qr: qrCodeData });
    console.log(`[${clientId}] QR generated`);
    // console.log(clientsMap.get(clientId));
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
