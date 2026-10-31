const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(filePath, 'utf8');

const badLine = 'var shareText = "BINGO! I just won a match on Yerase Bingo!\\nCard Prize Pool: " + prizeText + " ETB!\\nCome play the ultimate Ethiopian Bingo game right inside Telegram! Quick deposits, instant payouts, and huge jackpots!\\nStart playing now: https://t.me/Yerasegame"; margin-right:4px;"></i>Card Prize Pool: " + prizeText + " ETB!\\nCome play the ultimate Ethiopian Bingo game right inside Telegram! Quick deposits, instant payouts, and huge jackpots!\\nStart playing now: https://t.me/YeraseBingoBot";';

const goodLine = 'var shareText = "BINGO! I just won a match on Yerase Bingo!\\nCard Prize Pool: " + prizeText + " ETB!\\nCome play the ultimate Ethiopian Bingo game right inside Telegram! Quick deposits, instant payouts, and huge jackpots!\\nStart playing now: https://t.me/Yerasegame";';

if (html.includes(badLine)) {
  html = html.replace(badLine, goodLine);
  fs.writeFileSync(filePath, html, 'utf8');
  console.log('[✓] Successfully fixed shareText line!');
} else {
  console.log('[!] Bad line exact match failed, attempting regex...');
  const regex = /var shareText = "BINGO! I just won a match on Yerase Bingo![\s\S]*?https:\/\/t\.me\/YeraseBingoBot";/;
  if (regex.test(html)) {
    html = html.replace(regex, goodLine);
    fs.writeFileSync(filePath, html, 'utf8');
    console.log('[✓] Successfully fixed shareText via regex!');
  } else {
    console.error('Regex match failed.');
  }
}
