// ============================================================================
// YERASE BINGO - TELEGRAM BOT POLLING ENGINE (Node.js native HTTPS)
// Bot Token: 9104440496:AAF8C_Q5ohrC-KW7zbKXixVjJiQsMDVr0vs (@Yerasegame)
// Complete functional menu: Play, Balance, Deposit, Withdraw, Invite, Profile, Support, Rules
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

function getMainMenuKeyboard() {
  return {
    keyboard: [
      [{ text: '🎮 Play Bingo', web_app: { url: WEBAPP_URL } }],
      [{ text: '💰 Balance' }, { text: '📥 Deposit' }],
      [{ text: '📤 Withdraw' }, { text: '👥 Invite' }],
      [{ text: '👤 Profile' }, { text: '📞 Support' }],
      [{ text: '📖 Rules & Info' }]
    ],
    resize_keyboard: true,
    is_persistent: true
  };
}

function getContactRequestKeyboard() {
  return {
    keyboard: [
      [{ text: '📱 ስልክ ቁጥር አጋራ • Share Phone Number', request_contact: true }],
      [{ text: '🎮 Play Bingo', web_app: { url: WEBAPP_URL } }]
    ],
    resize_keyboard: true,
    one_time_keyboard: true
  };
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
  const username = msg.from.username ? '@' + msg.from.username : '@player_' + userId.slice(-4);

  // Ensure user exists in database
  const user = await db.getUser(userId);
  if (firstName && (!user.first_name || user.first_name.startsWith('Player '))) {
    user.first_name = firstName;
  }
  if (msg.from.username) {
    user.username = '@' + msg.from.username;
  }

  // 1. User shared contact
  if (msg.contact) {
    const phone = msg.contact.phone_number;
    user.phone = phone;
    user.first_name = firstName;
    user.username = username;
    await db.updateUserByAdmin(userId, { phone: phone, first_name: firstName, username: username });

    const phoneSuccessText = 
      `ሰላም ${firstName}፣ ስልክ ቁጥርዎ (${phone}) በተሳካ ሁኔታ ተረጋግጧል!\n\n` +
      `የ 200 ብር ነፃ መጫወቻ ቦነስ ወደ አካውንትዎ ገቢ ተደርጓል።\n\n` +
      `ከታች ያሉትን ዋና ማውጫ አዝራሮች በመጠቀም መጫወት፣ ሂሳብዎን ማየት፣ ገንዘብ ማስገባትና ማውጣት ይችላሉ! 👇`;

    await sendApiRequest('sendMessage', {
      chat_id: chatId,
      text: phoneSuccessText,
      reply_markup: getMainMenuKeyboard()
    });


    return;
  }

  const rawText = (msg.text || '').trim();
  const lower = rawText.toLowerCase();

  // 2. /start [refId] command
  if (rawText.startsWith('/start')) {
    const parts = rawText.split(' ');
    if (parts.length > 1 && parts[1]) {
      const refId = parts[1].trim();
      await db.addReferral(refId, userId);
    }

    const hasPhone = Boolean(user.phone && user.phone !== userId);

    const welcomeText = 
      `ሰላም ${firstName}! እንኳን ወደ **የራሴ ቢንጎ (Yerase Bingo)** በደህና መጡ!\n\n` +
      `**የኢትዮጵያ ቀዳሚው ዘመናዊ የቀጥታ ቢንጎ:**\n` +
      `• የ10 እና 20 ብር ክፍሎች (10 & 20 ETB Rooms)\n` +
      `• በቴሌብር እና በሲቢኢ ፈጣን ተቀማጭና ወጪ (Telebirr & CBE)\n` +
      `• 200 ብር የነፃ ቦነስ ለሁሉም አዲስ ተጫዋቾች\n` +
      `• ፈጣን የቀጥታ ክፍያዎችና የጃክፖት ሽልማቶች\n\n` +
      (hasPhone ? `ከታች ካለው ማውጫ የሚፈልጉትን አገልግሎት ይምረጡ 👇` : `ለቀጣይ ፈጣን አገልግሎት ስልክዎን ከታች ያጋሩ ወይም ቀጥታ ለመጫወት "Play Bingo" ይጫኑ 👇`);

    const markup = hasPhone ? getMainMenuKeyboard() : getContactRequestKeyboard();

    await sendApiRequest('sendMessage', {
      chat_id: chatId,
      text: welcomeText,
      parse_mode: 'Markdown',
      reply_markup: markup
    });

    return;
  }

  // 3. /menu command
  if (rawText === '/menu' || lower === 'menu' || lower === 'ማውጫ') {
    await sendApiRequest('sendMessage', {
      chat_id: chatId,
      text: `📋 **የራሴ ቢንጎ ዋና ማውጫ (Main Menu):**\nከታች ያሉትን አዝራሮች በመጠቀም አገልግሎቶችን ያግኙ:`,
      parse_mode: 'Markdown',
      reply_markup: getMainMenuKeyboard()
    });
    return;
  }

  // 4. BALANCE BUTTON
  if (lower.includes('balance') || lower.includes('ሒሳብ') || lower.includes('ባላንስ') || rawText === '/balance') {
    const liveUser = await db.getUser(userId);
    const mainBal = (parseFloat(liveUser.main_balance) || 0).toFixed(2);
    const playBal = (parseFloat(liveUser.play_balance) || 0).toFixed(2);
    const totBal = ((parseFloat(liveUser.main_balance) || 0) + (parseFloat(liveUser.play_balance) || 0)).toFixed(2);

    const balMsg = 
      `💰 **የሂሳብ መረጃዎ (Account Balance)**\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `• ዋና ሂሳብ (Withdrawable): **${mainBal} ETB**\n` +
      `• የቦነስ ሂሳብ (Play Bonus): **${playBal} ETB**\n` +
      `• ጠቅላላ ሂሳብ (Total): **${totBal} ETB**\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `💡 በቦነስ ሂሳብዎ ተጫውተው ያሸነፉትን ሙሉ በሙሉ ወጪ ማድረግ ይችላሉ!`;

    await sendApiRequest('sendMessage', {
      chat_id: chatId,
      text: balMsg,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📥 Deposit (ገንዘብ አስገባ)', web_app: { url: WEBAPP_URL } },
            { text: '📤 Withdraw (ወጪ አድርግ)', web_app: { url: WEBAPP_URL } }
          ],
          [
            { text: '🎮 Play Bingo Now', web_app: { url: WEBAPP_URL } }
          ]
        ]
      }
    });
    return;
  }

  // 5. DEPOSIT BUTTON
  if (lower.includes('deposit') || lower.includes('ተቀማጭ') || lower.includes('ብር አስገባ') || rawText === '/deposit') {
    const depMsg = 
      `📥 **ገንዘብ ማስገቢያ መመሪያ (Deposit Funds)**\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `ዝቅተኛ የማስገቢያ መጠን: **50 ብር (Min: 50 ETB)**\n\n` +
      `1. **በቴሌብር (Telebirr):**\n` +
      `   • የስልክ ቁጥር: \`09104440496\`\n` +
      `   • ስም: Yerase Bingo\n\n` +
      `2. **በኢትዮጵያ ንግድ ባንክ (CBE):**\n` +
      `   • የሂሳብ ቁጥር: \`1000123456789\`\n` +
      `   • ስም: Yerase Bingo\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `ገንዘቡን ካስተላለፉ በኋላ ከታች ያለውን **"Open Deposit Form"** በመጫን መጠኑን እና የSMS ማረጋገጫ ቁጥር ያስገቡ። ወዲያውኑ ይጸድቅልዎታል!`;

    await sendApiRequest('sendMessage', {
      chat_id: chatId,
      text: depMsg,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📥 Open Deposit in App', web_app: { url: WEBAPP_URL + (WEBAPP_URL.includes('?') ? '&' : '?') + 'action=deposit' } }]
        ]
      }
    });
    return;
  }

  // 6. WITHDRAW BUTTON
  if (lower.includes('withdraw') || lower.includes('ወጪ') || lower.includes('ብር አውጣ') || rawText === '/withdraw') {
    const liveUser = await db.getUser(userId);
    const mainBal = (parseFloat(liveUser.main_balance) || 0).toFixed(2);

    const withMsg = 
      `📤 **ገንዘብ ማውጫ (Withdraw Funds)**\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `• ወጪ ማድረግ የሚችሉት ሂሳብ: **${mainBal} ETB**\n` +
      `• ዝቅተኛ የማውጣት መጠን: **150 ብር (Min: 150 ETB)**\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `**የማውጫ ደንብ:**\n` +
      `ያስገቡትን ተቀማጭ 15x አጫውተው ሲያጠናቅቁ ያሸነፉትን ገንዘብ በቀጥታ ወደ ቴሌብር ወይም ንግድ ባንክ ማውጣት ይችላሉ።\n\n` +
      `ለማውጣት ከታች ያለውን **"Open Withdrawal Form"** ይጫኑ 👇`;

    await sendApiRequest('sendMessage', {
      chat_id: chatId,
      text: withMsg,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📤 Open Withdrawal in App', web_app: { url: WEBAPP_URL + (WEBAPP_URL.includes('?') ? '&' : '?') + 'action=withdraw' } }]
        ]
      }
    });
    return;
  }

  // 7. INVITE BUTTON
  if (lower.includes('invite') || lower.includes('ጓደኛ ጋብዝ') || lower.includes('ሪፈራል') || rawText === '/invite') {
    const liveUser = await db.getUser(userId);
    const refCount = liveUser.invited || 0;
    const refLink = `https://t.me/Yerasegame?start=${userId}`;
    const shareText = encodeURIComponent(`ና የራሴ ቢንጎ እንጫወት! 200 ብር ነፃ መጫወቻ ቦነስ ተቀበል! 👉 ${refLink}`);

    const inviteMsg = 
      `👥 **ጓደኛ ይጋብዙና ተጨማሪ ቦነስ ያግኙ! (Invite & Earn)**\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `የእርስዎ መጋበዣ ሊንክ:\n` +
      `\`${refLink}\`\n\n` +
      `• የጋበዟቸው ተጫዋቾች ብዛት: **${refCount} ተጫዋቾች**\n` +
      `• ሽልማት: **ለእያንዳንዱ ለሚጋብዙት ጓደኛ 10 ብር የነፃ ቦነስ ያገኛሉ!**\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `ሊንኩን ለጓደኞችዎ ወይም በቴሌግራም ግሩፖች ላይ በማጋራት ተጠቃሚ ይሁኑ! 👇`;

    await sendApiRequest('sendMessage', {
      chat_id: chatId,
      text: inviteMsg,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🚀 Share Invite Link (አጋራ)', url: `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${shareText}` }],
          [{ text: '🎮 Play Bingo', web_app: { url: WEBAPP_URL } }]
        ]
      }
    });
    return;
  }

  // 8. PROFILE BUTTON
  if (lower.includes('profile') || lower.includes('መገለጫ') || rawText === '/profile') {
    const liveUser = await db.getUser(userId);
    const idFormatted = userId.length > 10 ? userId.slice(-10) : userId;
    const phoneDisplay = liveUser.phone && liveUser.phone !== userId ? liveUser.phone : 'ያልተመዘገበ (Not shared)';
    const handle = liveUser.username || username;

    const profMsg = 
      `👤 **የተጫዋች መገለጫ (Player Profile)**\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `• ስም / መጠሪያ: **${liveUser.first_name || firstName}**\n` +
      `• ዩዘርኔም (Username): **${handle}**\n` +
      `• መለያ ቁጥር (Profile ID): \`${idFormatted}\`\n` +
      `• ስልክ ቁጥር: \`${phoneDisplay}\`\n` +
      `• የተጫወቱት ጨዋታ: **${liveUser.games_played || 0}**\n` +
      `• ያሸነፉት ጨዋታ: **${liveUser.games_won || 0}**\n` +
      `• ያሸነፉት ጠቅላላ ብር: **${(liveUser.total_won || 0).toFixed(2)} ETB**\n` +
      `• ደረጃ: **${liveUser.is_vip ? 'VIP Member' : 'Standard Member'}**\n` +
      `━━━━━━━━━━━━━━━━━━`;

    await sendApiRequest('sendMessage', {
      chat_id: chatId,
      text: profMsg,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🎮 Open Profile in App', web_app: { url: WEBAPP_URL } }]
        ]
      }
    });
    return;
  }

  // 9. SUPPORT BUTTON
  if (lower.includes('support') || lower.includes('እገዛ') || lower.includes('ድጋፍ') || rawText === '/support') {
    const supportMsg = 
      `📞 **የደንበኞች ድጋፍ አገልግሎት (Customer Support)**\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `ማንኛውም ጥያቄ፣ አስተያየት ወይም የክፍያ ጉዳይ ካጋጠመዎት የድጋፍ ሰጪ ቡድናችንን 24/7 በቴሌግራም ማነጋገር ይችላሉ፦\n\n` +
      `• Telegram Support: @one_day_82\n` +
      `• ኦፊሴላዊ የቴሌግራም ቻናል: @Yerasegame\n` +
      `━━━━━━━━━━━━━━━━━━`;

    await sendApiRequest('sendMessage', {
      chat_id: chatId,
      text: supportMsg,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '💬 Contact Support (@one_day_82)', url: 'https://t.me/one_day_82' }]
        ]
      }
    });
    return;
  }

  // 10. RULES & INFO BUTTON
  if (lower.includes('rule') || lower.includes('help') || lower.includes('መመሪያ') || rawText === '/help' || rawText === '/rules') {
    const rulesMsg = 
      `📖 **የጨዋታ ደንብና መመሪያ (How to Play)**\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `1. **ክፍል ይምረጡ:** የ10 ወይም የ20 ብር ክፍል ይምረጡ።\n` +
      `2. **ካርቴላ ይቁረጡ:** ቆጣሪው ከማለቁ በፊት እስከ 2 ካርቴላዎችን ይምረጡ።\n` +
      `3. **ቁጥሮች ሲጠሩ:** Auto Daub የነቁ ካርቴላዎችን በራስ-ሰር ያደምቃል!\n` +
      `4. **BINGO:** ማንኛውንም አግድም፣ ቁመት፣ ሰያፍ ወይም 4 ማዕዘን ሲሞሉ BINGO ያሸንፋሉ!\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `ለመጫወት ከታች ያለውን "Play Bingo" ይጫኑ 👇`;

    await sendApiRequest('sendMessage', {
      chat_id: chatId,
      text: rulesMsg,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🎮 Play Bingo Now', web_app: { url: WEBAPP_URL } }]
        ]
      }
    });
    return;
  }

  // 11. PLAY BUTTON
  if (lower.includes('play') || lower.includes('ተጫወት')) {
    await sendApiRequest('sendMessage', {
      chat_id: chatId,
      text: `🎮 **የራሴ ቢንጎን አሁኑኑ ይጫወቱ!**\nከታች ያለውን ቁልፍ በመጫን በቀጥታ ይግቡ:`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🎮 የራሴ ቢንጎ ተጫወት • Play Bingo', web_app: { url: WEBAPP_URL } }]
        ]
      }
    });
    return;
  }

  // Fallback response with main menu
  await sendApiRequest('sendMessage', {
    chat_id: chatId,
    text: `ሰላም ${firstName}! ከታች ካሉት አዝራሮች የሚፈልጉትን ይምረጡ 👇`,
    reply_markup: getMainMenuKeyboard()
  });
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
