const fs = require('fs');
const path = require('path');

const jsPath = path.join(__dirname, '..', 'telegram_bot.js');
let js = fs.readFileSync(jsPath, 'utf8');

const regexJs = /await sendApiRequest\('sendMessage',\s*\{\s*chat_id:\s*chatId,\s*text:\s*`🎮 ጨዋታውን ለመጀመር ከታች ያለውን ይጫኑ:`[\s\S]*?\}\s*\);\s*/;
if (regexJs.test(js)) {
  js = js.replace(regexJs, '');
  fs.writeFileSync(jsPath, js, 'utf8');
  console.log('[✓] Removed extra start message from telegram_bot.js');
}

const pyPath = path.join(__dirname, '..', 'telegram_bot.py');
let py = fs.readFileSync(pyPath, 'utf8');

const regexPy = /await update\.message\.reply_text\(\s*"🎮 ጨዋታውን ለመጀመር ከታች ያለውን ይጫኑ:"[\s\S]*?\)\s*/;
if (regexPy.test(py)) {
  py = py.replace(regexPy, '');
  fs.writeFileSync(pyPath, py, 'utf8');
  console.log('[✓] Removed extra start message from telegram_bot.py');
}
