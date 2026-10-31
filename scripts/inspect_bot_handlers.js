const fs = require('fs');
const path = require('path');

const botJs = fs.readFileSync(path.join(__dirname, '..', 'telegram_bot.js'), 'utf8');

const sIdx = botJs.indexOf("if (rawText.startsWith('/start')");
console.log('--- /start HANDLER ---');
console.log(botJs.slice(sIdx, sIdx + 1200));

const cIdx = botJs.indexOf("if (message.contact)");
console.log('\n--- CONTACT HANDLER ---');
console.log(botJs.slice(cIdx, cIdx + 900));
