const fs = require('fs');
const path = require('path');

// Update telegram_bot.js
const jsPath = path.join(__dirname, '..', 'telegram_bot.js');
let js = fs.readFileSync(jsPath, 'utf8');

const jsContactExtra = `    await sendApiRequest('sendMessage', {
      chat_id: chatId,
      text: \`አሁኑኑ የራሴ ቢንጎን ለመጫወት "Play Bingo" ይጫኑ:\`,
      reply_markup: {
        inline_keyboard: [
          [{ text: '🎮 የራሴ ቢንጎ ተጫወት • Play Bingo', web_app: { url: WEBAPP_URL } }]
        ]
      }
    });`;

if (js.includes(jsContactExtra)) {
  js = js.replace(jsContactExtra, '');
  console.log('[✓] Removed extra play message after contact share in telegram_bot.js');
}

const jsStartExtra = `    await sendApiRequest('sendMessage', {
      chat_id: chatId,
      text: \`🎮 ጨዋታውን ለመጀመር ከታች ያለውን ይጫኑ:\`,
      reply_markup: {
        inline_keyboard: [
          [{ text: '🎮 የራሴ ቢንጎ ተጫወት • Play Bingo', web_app: { url: WEBAPP_URL } }]
        ]
      }
    });`;

if (js.includes(jsStartExtra)) {
  js = js.replace(jsStartExtra, '');
  console.log('[✓] Removed extra play message in /start in telegram_bot.js');
}

fs.writeFileSync(jsPath, js, 'utf8');


// Update telegram_bot.py
const pyPath = path.join(__dirname, '..', 'telegram_bot.py');
let py = fs.readFileSync(pyPath, 'utf8');

const pyContactExtra = `        await update.message.reply_text(
            "አሁኑኑ የራሴ ቢንጎን ለመጫወት \\"Play Bingo\\" ይጫኑ:",
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton("🎮 የራሴ ቢንጎ ተጫወት • Play Bingo", web_app=WebAppInfo(url=WEBAPP_URL))]
            ])
        )`;

if (py.includes(pyContactExtra)) {
  py = py.replace(pyContactExtra, '');
  console.log('[✓] Removed extra play message after contact share in telegram_bot.py');
}

const pyStartExtra = `        await update.message.reply_text(
            "🎮 ጨዋታውን ለመጀመር ከታች ያለውን ይጫኑ:",
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton("🎮 የራሴ ቢንጎ ተጫወት • Play Bingo", web_app=WebAppInfo(url=WEBAPP_URL))]
            ])
        )`;

if (py.includes(pyStartExtra)) {
  py = py.replace(pyStartExtra, '');
  console.log('[✓] Removed extra play message in /start in telegram_bot.py');
}

fs.writeFileSync(pyPath, py, 'utf8');
console.log('Done cleaning up extra bot messages.');
