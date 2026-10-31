const fs = require('fs');
const path = require('path');

const jsPath = path.join(__dirname, '..', 'telegram_bot.js');
let lines = fs.readFileSync(jsPath, 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Profile ID:')) {
    lines[i] = "      '• *Profile ID:* ' + idFormatted + '\\n' +";
  }
  if (lines[i].includes('Phone Number:') && lines[i].includes('phoneDisplay')) {
    lines[i] = "      '• *Phone Number:* ' + phoneDisplay + '\\n' +";
  }
}

fs.writeFileSync(jsPath, lines.join('\n'), 'utf8');
console.log('Fixed Profile ID and Phone Number lines.');
