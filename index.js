const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
     const fs = require('fs');

let sessionData;
// if(fs.existsSync('./session.json')) {
//     console.log("Session file found, loading...") ;
//     sessionData = JSON.parse(fs.readFile('./session.json')) ;
// }
const client = new Client(  {  puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'], 
        headless: true,
    }, authStrategy: new LocalAuth()}
);
// const client = new Client({ authStrategy: new LocalAuth() });

//  client.on('authenticated', (session) => {
//          fs.writeFile('./session.json', JSON.stringify(session)); // Save session data to a file
//      });

client.on('qr', (qr) => {
qrcode.generate(qr, { small: true });
console.log('QR received, scan please!');
});

client.on('ready', () => {
console.log('Client is ready!');
});

client.on('message', async message => {
    console.log(message.body);
if (message.body === '!ping') {
await message.reply('pong');
}
});

 client.on('disconnected', (reason) => {
         console.log('Client was logged out', reason);
         if (reason === 'We needed to reconnect') {
             // Handle reconnection logic
                client.initialize();
         }
     });

client.initialize();