// ============================================================================
// YERASE BINGO - TELEGRAM BOT POLLING ENGINE (Node.js native HTTPS)
// Bot Token: 9104440496:AAF8C_Q5ohrC-KW7zbKXixVjJiQsMDVr0vs (@Yerasegame)
// ============================================================================

const https = require('https');
const db = require('./database');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '9104440496:AAF8C_Q5ohrC-KW7zbKXixVjJiQsMDVr0vs';
const WEBAPP_URL = process.env.BINGO_WEBAPP_URL || 'https://yerase-bingo.onrender.com/';

function sendApiRequest(method, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${BOT_TOKEN}/${method}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      },
      timeout: 35000
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve({ ok: false, error: e.message });
        }
      });
    });

    req.on('error', (err) => resolve({ ok: false, error: err.message }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, error: 'Timeout' });
    });

    req.write(data);
    req.end();
  });
}

let offset = 0;
let isPolling = false;

async function pollUpdates() {
  if (isPolling) return;
  isPolling = true;

  try {
    const res = await sendApiRequest('getUpdates', {
      offset: offset,
      timeout: 25,
      allowed_updates: ['message', 'callback_query']
    });

    if (res && res.ok && Array.isArray(res.result)) {
      for (const update of res.result) {
        offset = update.update_id + 1;
        await handleUpdate(update);
      }
    }
  } catch (err) {
    console.error('[Telegram Bot] Polling error:', err.message);
  } finally {
    isPolling = false;
    setTimeout(pollUpdates, 1000);
  }
}

async function handleUpdate(update) {
  if (!update.message) return;
  const msg = update.message;
  const chatId = msg.chat.id;
  const userId = String(msg.from.id);
  const firstName = msg.from.first_name || 'ተጫዋች';

  // 1. User shared contact
  if (msg.contact) {
    const phone = msg.contact.phone_number;
    const user = await db.getUser(userId);
    user.phone = phone;
    user.first_name = firstName;
    user.username = msg.from.username ? '@' + msg.from.username : user.username;
    await db.updateUserByAdmin(userId, { phone: phone, first_name: firstName });

    await sendApiRequest('sendMessage', {
      chat_id: chatId,
      text: `ሰላም ${firstName}፣ ስልክ ቁጥርዎ (${phone}) በተሳካ ሁኔታ ተመዝግቧል!\n\nየ 200 ብር ነፃ መጫወቻ ቦነስ ወደ አካውንትዎ ገቢ ተደርጓል።\n\nከታች ያለውን "Play Bingo" በመጫን አሁኑኑ ይጫወቱ! `,
      reply_markup: {
        inline_keyboard: [
          [{ text: 'የራሴ ቢንጎ ተጫወት • Play Bingo', web_app: { url: WEBAPP_URL } }]
        ]
      }
    });
    return;
  }

  const text = (msg.text || '').trim();

  // 2. /start command
  if (text.startsWith('/start') || text === '/play') {
    // Ensure user is created in database with 200 ETB bonus
    const user = await db.getUser(userId);
    user.first_name = firstName;
    if (msg.from.username) user.username = '@' + msg.from.username;

    const welcomeText = 
      `ሰላም ${firstName}! እንኳን ወደ **የራሴ ቢንጎ (Yerase Bingo)** በደህና መጡ!\n\n` +
      `**የኢትዮጵያ ቀዳሚው ዘመናዊ የቀጥታ ቢንጎ:**\n` +
      `• የ10 እና 20 ብር ክፍሎች (10 & 20 ETB Rooms)\n` +
      `• በቴሌብር እና በሲቢኢ ፈጣን ተቀማጭና ወጪ (Telebirr & CBE)\n` +
      `• 200 ብር የነፃ ቦነስ ለሁሉም ተጫዋቾች (200 ETB Bonus)\n` +
      `• የቀጥታ ውጤትና የጃክፖት ሽልማቶች\n\n` +
      `ለመጀመር ከታች ያለውን **"Play Bingo"** ቁልፍ ይጫኑ! ወይም ለቀጣይ ፈጣን አገልግሎት ስልክዎን ያጋሩ። `;

    await sendApiRequest('sendMessage', {
      chat_id: chatId,
      text: welcomeText,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: 'የራሴ ቢንጎ ተጫወት • Play Bingo', web_app: { url: WEBAPP_URL } }],
          [{ text: 'የደንበኞች ድጋፍ • Support', url: 'https://t.me/one_day_82' }]
        ]
      }
    });

    // Also send phone sharing keyboard button
    await sendApiRequest('sendMessage', {
      chat_id: chatId,
      text: 'ስልክ ቁጥርዎን ለማረጋገጥ ከታች ያለውን ቁልፍ ይጫኑ:',
      reply_markup: {
        keyboard: [
          [{ text: 'ስልክ ቁጥር አጋራ • Share Phone Number', request_contact: true }]
        ],
        resize_keyboard: true,
        one_time_keyboard: true
      }
    });
    return;
  }

  // 3. /help command
  if (text === '/help' || text === '/rules') {
    await sendApiRequest('sendMessage', {
      chat_id: chatId,
      text: 
        `**የራሴ ቢንጎ - መመሪያ**\n\n` +
        `1. በ10 ወይም 20 ብር ክፍል ይግቡ።\n` +
        `2. እስከ 2 ካርቴላ ይምረጡ።\n` +
        `3. ቁጥሮች በቀጥታ ሲጠሩ በራስ-ሰር ምልክት ይደረግባቸዋል (Auto Daub)።\n` +
        `4. 5 ቁጥሮች በአንድ መስመር፣ አምድ፣ ወይም ዲያጎናል ሙሉ ሲሆኑ BINGO ያሸንፋሉ!\n\n` +
        `ለእገዛ: @one_day_82`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: 'የራሴ ቢንጎ ተጫወት • Play Bingo', web_app: { url: WEBAPP_URL } }]
        ]
      }
    });
    return;
  }
}

function startBot() {
  console.log('[Telegram Bot] Starting Yerase Bingo Bot listener for token:', BOT_TOKEN.slice(0, 10) + '...');
  sendApiRequest('getMe', {}).then(me => {
    if (me && me.ok) {
      console.log(`[Telegram Bot] Connected successfully as @${me.result.username} (${me.result.first_name})`);
    } else {
      console.warn('[Telegram Bot] getMe warning:', me);
    }
  }).catch(e => console.error('[Telegram Bot] Connection error:', e));

  pollUpdates();
}

module.exports = { startBot };
