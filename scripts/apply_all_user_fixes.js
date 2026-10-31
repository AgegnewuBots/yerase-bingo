const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const indexPath = path.join(root, 'index.html');
const tgBotPath = path.join(root, 'telegram_bot.js');
const tgPyPath = path.join(root, 'telegram_bot.py');
const dbPath = path.join(root, 'database.js');
const dbJsonPath = path.join(root, 'data', 'bingo_database.json');

console.log('=== STARTING ALL USER REQUESTED FIXES ===');

// ==========================================
// 1. DATABASE UPDATES: 5 ETB REFERRAL & OFFICIAL HANDLES
// ==========================================
let dbCode = fs.readFileSync(dbPath, 'utf8');
dbCode = dbCode.replace("bot_link: 'https://t.me/yerase_bingo_bot',", "bot_link: 'https://t.me/YerasegameBot',");
dbCode = dbCode.replace("support_link: 'https://t.me/one_day_82'", "support_link: 'https://t.me/Agegnewu0102',\n    channel_link: 'https://t.me/yerasebingo'");
dbCode = dbCode.replace(
  "referrer.play_balance = Math.round(((parseFloat(referrer.play_balance) || 0) + 10) * 100) / 100;",
  "referrer.play_balance = Math.round(((parseFloat(referrer.play_balance) || 0) + 5) * 100) / 100;"
);
fs.writeFileSync(dbPath, dbCode, 'utf8');
console.log('[✓] database.js updated with 5 ETB referral bonus and official links');

if (fs.existsSync(dbJsonPath)) {
  let dbJson = fs.readFileSync(dbJsonPath, 'utf8');
  dbJson = dbJson.replace('"bot_link": "https://t.me/yerase_bingo_bot"', '"bot_link": "https://t.me/YerasegameBot"');
  dbJson = dbJson.replace('"support_link": "https://t.me/one_day_82"', '"support_link": "https://t.me/Agegnewu0102",\n    "channel_link": "https://t.me/yerasebingo"');
  fs.writeFileSync(dbJsonPath, dbJson, 'utf8');
  console.log('[✓] bingo_database.json updated with official links');
}

// ==========================================
// 2. TELEGRAM BOT JS (Clean English, 5 ETB Bonus, Rules & Info Toggle)
// ==========================================
const botCode = `// ============================================================================
// YERASE BINGO - TELEGRAM BOT POLLING ENGINE (Node.js Native HTTPS)
// Bot Username: @YerasegameBot
// Official Support: @Agegnewu0102
// Official Channel: @yerasebingo
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
      path: \`/bot\${BOT_TOKEN}/\${method}\`,
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
      [{ text: '📱 Share Phone Number', request_contact: true }],
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
  // 1. Handle Callback Queries (Rules & Info toggle)
  if (update.callback_query) {
    await handleCallbackQuery(update.callback_query);
    return;
  }

  if (!update.message) return;
  const msg = update.message;
  const chatId = msg.chat.id;
  const userId = String(msg.from.id);
  const firstName = msg.from.first_name || 'Player';
  const username = msg.from.username ? '@' + msg.from.username : '@player_' + userId.slice(-4);

  // Ensure user exists in database
  const user = await db.getUser(userId);
  if (firstName && (!user.first_name || user.first_name.startsWith('Player '))) {
    user.first_name = firstName;
  }
  if (msg.from.username) {
    user.username = '@' + msg.from.username;
  }

  // 2. User shared contact
  if (msg.contact) {
    const phone = msg.contact.phone_number;
    user.phone = phone;
    user.first_name = firstName;
    user.username = username;
    await db.updateUserByAdmin(userId, { phone: phone, first_name: firstName, username: username });

    const phoneSuccessText = 
      \`✅ *Phone Number Verified Successfully!*\\n\\n\` +
      \`Welcome, \${firstName}! Your phone number (\`\${phone}\`) is now linked to your account.\\n\\n\` +
      \`• 200 ETB Free Welcome Bonus is ready in your account!\\n\` +
      \`• Use the interactive menu below to play, view your balance, deposit, or withdraw funds 👇\`;

    await sendApiRequest('sendMessage', {
      chat_id: chatId,
      text: phoneSuccessText,
      parse_mode: 'Markdown',
      reply_markup: getMainMenuKeyboard()
    });
    return;
  }

  const rawText = (msg.text || '').trim();
  const lower = rawText.toLowerCase();

  // 3. /start [refId] command
  if (rawText.startsWith('/start')) {
    const parts = rawText.split(' ');
    if (parts.length > 1 && parts[1]) {
      const refId = parts[1].trim();
      await db.addReferral(refId, userId);
    }

    const hasPhone = Boolean(user.phone && user.phone !== userId);

    const welcomeText = 
      \`🎮 *Welcome to Yerase Bingo!*\\n\\n\` +
      \`Ethiopia's premier live multiplayer Bingo gaming platform on Telegram.\\n\\n\` +
      \`*Key Features:*\\n\` +
      \`• Synchronized 10 ETB & 20 ETB live rooms\\n\` +
      \`• Instant deposits & withdrawals via Telebirr & CBE\\n\` +
      \`• 200 ETB Free Welcome Bonus for every new player\\n\` +
      \`• 5 ETB Free Play Bonus for every friend you invite\\n\` +
      \`• Provably fair live ball drawing and instant cashouts\\n\\n\` +
      (hasPhone 
        ? \`Please choose an option from the menu below to get started 👇\` 
        : \`Please share your phone number below to verify your account and claim your 200 ETB welcome bonus 👇\`);

    const markup = hasPhone ? getMainMenuKeyboard() : getContactRequestKeyboard();

    await sendApiRequest('sendMessage', {
      chat_id: chatId,
      text: welcomeText,
      parse_mode: 'Markdown',
      reply_markup: markup
    });
    return;
  }

  // 4. /menu command
  if (rawText === '/menu' || lower === 'menu') {
    await sendApiRequest('sendMessage', {
      chat_id: chatId,
      text: \`📋 *Yerase Bingo Main Menu*\\nChoose an option from the keyboard below:\`,
      parse_mode: 'Markdown',
      reply_markup: getMainMenuKeyboard()
    });
    return;
  }

  // 5. BALANCE BUTTON
  if (lower.includes('balance') || lower.includes('ሒሳብ') || lower.includes('ባላንስ') || rawText === '/balance') {
    const liveUser = await db.getUser(userId);
    const mainBal = (parseFloat(liveUser.main_balance) || 0).toFixed(2);
    const playBal = (parseFloat(liveUser.play_balance) || 0).toFixed(2);
    const totBal = ((parseFloat(liveUser.main_balance) || 0) + (parseFloat(liveUser.play_balance) || 0)).toFixed(2);

    const balMsg = 
      \`💰 *Your Account Balance Summary*\\n\` +
      \`━━━━━━━━━━━━━━━━━━━━\\n\` +
      \`• *Withdrawable Main Balance:* \${mainBal} ETB\\n\` +
      \`• *Free Play Bonus Balance:* \${playBal} ETB\\n\` +
      \`• *Total Balance:* \${totBal} ETB\\n\` +
      \`━━━━━━━━━━━━━━━━━━━━\\n\` +
      \`💡 *Winnings from your play bonus are 100% withdrawable once wagering requirements are met!*\`;

    await sendApiRequest('sendMessage', {
      chat_id: chatId,
      text: balMsg,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📥 Deposit Funds', web_app: { url: WEBAPP_URL + (WEBAPP_URL.includes('?') ? '&' : '?') + 'action=deposit' } },
            { text: '📤 Withdraw Funds', web_app: { url: WEBAPP_URL + (WEBAPP_URL.includes('?') ? '&' : '?') + 'action=withdraw' } }
          ],
          [
            { text: '🎮 Play Bingo Now', web_app: { url: WEBAPP_URL } }
          ]
        ]
      }
    });
    return;
  }

  // 6. DEPOSIT BUTTON
  if (lower.includes('deposit') || lower.includes('ተቀማጭ') || lower.includes('ብር አስገባ') || rawText === '/deposit') {
    const depMsg = 
      \`📥 *Deposit Funds to Yerase Bingo*\\n\` +
      \`━━━━━━━━━━━━━━━━━━━━\\n\` +
      \`*Minimum Deposit Amount:* 50 ETB\\n\\n\` +
      \`*1. Telebirr:*\\n\` +
      \`   • Phone Number: \`09104440496\`\\n\` +
      \`   • Account Name: Yerase Bingo\\n\\n\` +
      \`*2. Commercial Bank of Ethiopia (CBE):*\\n\` +
      \`   • CBE Account: \`1000123456789\`\\n\` +
      \`   • Account Name: Yerase Bingo\\n\` +
      \`━━━━━━━━━━━━━━━━━━━━\\n\` +
      \`*How to Complete Deposit:*\\n\` +
      \`Transfer funds via Telebirr or CBE, then tap *"Open Deposit in App"* below to submit your transaction screenshot or SMS reference. Funds are credited instantly!\`;

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

  // 7. WITHDRAW BUTTON
  if (lower.includes('withdraw') || lower.includes('ወጪ') || lower.includes('ብር አውጣ') || rawText === '/withdraw') {
    const liveUser = await db.getUser(userId);
    const mainBal = (parseFloat(liveUser.main_balance) || 0).toFixed(2);

    const withMsg = 
      \`📤 *Withdraw Funds*\\n\` +
      \`━━━━━━━━━━━━━━━━━━━━\\n\` +
      \`• *Your Withdrawable Balance:* \${mainBal} ETB\\n\` +
      \`• *Minimum Withdrawal Amount:* 150 ETB\\n\` +
      \`• *Supported Payout Methods:* Commercial Bank of Ethiopia (CBE) & Telebirr\\n\` +
      \`*(Note: CBE Birr is not supported — use CBE Account or Telebirr)*\\n\` +
      \`━━━━━━━━━━━━━━━━━━━━\\n\` +
      \`*Withdrawal Policy:*\\n\` +
      \`Deposited funds and winnings become withdrawable once you deposit at least 50 ETB and wager 15x your total deposit amount.\\n\\n\` +
      \`Tap *"Open Withdrawal in App"* below to select your payout method (CBE or Telebirr) and submit your request 👇\`;

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

  // 8. INVITE BUTTON (5 ETB Bonus)
  if (lower.includes('invite') || lower.includes('ጓደኛ ጋብዝ') || lower.includes('ሪፈራል') || rawText === '/invite') {
    const liveUser = await db.getUser(userId);
    const refCount = liveUser.invited || 0;
    const refLink = \`https://t.me/YerasegameBot?start=\${userId}\`;
    const shareText = encodeURIComponent(\`Play Yerase Bingo on Telegram! Get 200 ETB free welcome bonus! 👉 \${refLink}\`);

    const inviteMsg = 
      \`👥 *Invite Friends & Earn Free Play Bonus*\\n\` +
      \`━━━━━━━━━━━━━━━━━━━━\\n\` +
      \`*Your Personal Referral Link:*\\n\` +
      \`\`\${refLink}\`\\n\\n\` +
      \`• *Total Friends Invited:* \${refCount} players\\n\` +
      \`• *Referral Reward:* Earn *5 ETB Free Play Bonus* for every friend who joins!\\n\` +
      \`• *Usage:* Bonus funds are added directly to your play balance to win real prizes!\\n\` +
      \`━━━━━━━━━━━━━━━━━━━━\\n\` +
      \`Share your invite link to Telegram groups and friends now 👇\`;

    await sendApiRequest('sendMessage', {
      chat_id: chatId,
      text: inviteMsg,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🚀 Share Invite Link', url: \`https://t.me/share/url?url=\${encodeURIComponent(refLink)}&text=\${shareText}\` }],
          [{ text: '🎮 Play Bingo', web_app: { url: WEBAPP_URL } }]
        ]
      }
    });
    return;
  }

  // 9. PROFILE BUTTON
  if (lower.includes('profile') || lower.includes('መገለጫ') || rawText === '/profile') {
    const liveUser = await db.getUser(userId);
    const idFormatted = userId.length > 10 ? userId.slice(-10) : userId;
    const phoneDisplay = liveUser.phone && liveUser.phone !== userId ? liveUser.phone : 'Not shared';
    const handle = liveUser.username || username;

    const profMsg = 
      \`👤 *Player Profile Card*\\n\` +
      \`━━━━━━━━━━━━━━━━━━━━\\n\` +
      \`• *Player Name:* \${liveUser.first_name || firstName}\\n\` +
      \`• *Telegram Username:* \${handle}\\n\` +
      \`• *Profile ID:* \`\${idFormatted}\`\\n\` +
      \`• *Phone Number:* \`\${phoneDisplay}\`\\n\` +
      \`• *Games Played:* \${liveUser.games_played || 0}\\n\` +
      \`• *Games Won:* \${liveUser.games_won || 0}\\n\` +
      \`• *Total Won:* \${(liveUser.total_won || 0).toFixed(2)} ETB\\n\` +
      \`• *Member Tier:* \${liveUser.is_vip ? 'VIP Member' : 'Standard Member'}\\n\` +
      \`━━━━━━━━━━━━━━━━━━━━\`;

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

  // 10. SUPPORT BUTTON
  if (lower.includes('support') || lower.includes('እገዛ') || lower.includes('ድጋፍ') || rawText === '/support') {
    const supportMsg = 
      \`📞 *Customer Support & Official Channel*\\n\` +
      \`━━━━━━━━━━━━━━━━━━━━\\n\` +
      \`Have questions, payment inquiries, or feedback? Contact our team 24/7:\\n\\n\` +
      \`• *Telegram Support:* @Agegnewu0102\\n\` +
      \`• *Official Channel:* @yerasebingo\\n\` +
      \`• *Official Bot:* @YerasegameBot\\n\` +
      \`━━━━━━━━━━━━━━━━━━━━\`;

    await sendApiRequest('sendMessage', {
      chat_id: chatId,
      text: supportMsg,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '💬 Contact Support (@Agegnewu0102)', url: 'https://t.me/Agegnewu0102' }],
          [{ text: '📢 Join Channel (@yerasebingo)', url: 'https://t.me/yerasebingo' }]
        ]
      }
    });
    return;
  }

  // 11. RULES & INFO BUTTON (With Inline Toggle)
  if (lower.includes('rule') || lower.includes('help') || lower.includes('መመሪያ') || rawText === '/help' || rawText === '/rules') {
    const rulesMsg = getRulesText();

    await sendApiRequest('sendMessage', {
      chat_id: chatId,
      text: rulesMsg,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: 'ℹ️ View Platform Info', callback_data: 'view_info' }],
          [{ text: '🎮 Play Bingo Now', web_app: { url: WEBAPP_URL } }]
        ]
      }
    });
    return;
  }

  // 12. PLAY BUTTON
  if (lower.includes('play') || lower.includes('ተጫወት')) {
    await sendApiRequest('sendMessage', {
      chat_id: chatId,
      text: \`🎮 *Play Yerase Bingo Live Now!*\\nTap below to launch the Mini App:\`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🎮 Launch Yerase Bingo', web_app: { url: WEBAPP_URL } }]
        ]
      }
    });
    return;
  }

  // Fallback response with main menu
  await sendApiRequest('sendMessage', {
    chat_id: chatId,
    text: \`Hello \${firstName}! Please choose an option from the menu below 👇\`,
    reply_markup: getMainMenuKeyboard()
  });
}

function getRulesText() {
  return \`📖 *How to Play Yerase Bingo*\\n\` +
    \`━━━━━━━━━━━━━━━━━━━━\\n\` +
    \`1. *Select a Room:* Choose the 10 ETB or 20 ETB live room.\\n\` +
    \`2. *Pick Cartelas:* Select up to 2 lucky cartelas before the 60-second round countdown ends.\\n\` +
    \`3. *Live Ball Calls:* Numbers from 1 to 75 are drawn randomly by the server. Your cards auto-daub called numbers in real time!\\n\` +
    \`4. *Winning BINGO:* Complete any horizontal, vertical, diagonal line, or 4 corners to hit BINGO and claim the prize pot!\\n\` +
    \`━━━━━━━━━━━━━━━━━━━━\`;
}

function getInfoText() {
  return \`ℹ️ *Yerase Bingo Platform Info*\\n\` +
    \`━━━━━━━━━━━━━━━━━━━━\\n\` +
    \`• *Fair & Transparent:* Provably fair deterministic card numbers and server-side ball calling.\\n\` +
    \`• *Secure Banking:* Direct deposit and withdrawal verification via CBE & Telebirr.\\n\` +
    \`• *Bonus System:* 200 ETB free welcome bonus + 5 ETB free bonus for each friend invited.\\n\` +
    \`• *Official Bot:* @YerasegameBot\\n\` +
    \`• *Customer Support:* @Agegnewu0102\\n\` +
    \`• *Official Community Channel:* @yerasebingo\\n\` +
    \`━━━━━━━━━━━━━━━━━━━━\`;
}

async function handleCallbackQuery(cb) {
  const data = cb.data;
  const msg = cb.message;
  if (!msg) return;

  const chatId = msg.chat.id;
  const messageId = msg.message_id;

  try {
    await sendApiRequest('answerCallbackQuery', { callback_query_id: cb.id });

    if (data === 'view_info') {
      await sendApiRequest('editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text: getInfoText(),
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📖 View Game Rules', callback_data: 'view_rules' }],
            [{ text: '🎮 Play Bingo Now', web_app: { url: WEBAPP_URL } }]
          ]
        }
      });
    } else if (data === 'view_rules') {
      await sendApiRequest('editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text: getRulesText(),
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: 'ℹ️ View Platform Info', callback_data: 'view_info' }],
            [{ text: '🎮 Play Bingo Now', web_app: { url: WEBAPP_URL } }]
          ]
        }
      });
    }
  } catch (err) {
    console.error('[Telegram Bot] Callback error:', err.message);
  }
}

function startBot() {
  console.log('[Telegram Bot] Starting Yerase Bingo Bot listener for token: ' + BOT_TOKEN.slice(0, 10) + '...');
  sendApiRequest('getMe', {}).then(me => {
    if (me && me.ok) {
      console.log(\`[Telegram Bot] Connected successfully as @\${me.result.username} (\${me.result.first_name})\`);
      pollUpdates();
    } else {
      console.error('[Telegram Bot] Connection failed:', me);
    }
  }).catch(err => {
    console.error('[Telegram Bot] Startup error:', err.message);
  });
}

module.exports = {
  startBot,
  sendApiRequest,
  getMainMenuKeyboard
};
`;

fs.writeFileSync(tgBotPath, botCode, 'utf8');
console.log('[✓] telegram_bot.js updated with clean English & official handles');

// ==========================================
// 3. TELEGRAM BOT PYTHON (Match JS)
// ==========================================
let tgPy = fs.readFileSync(tgPyPath, 'utf8');
tgPy = tgPy.replace(/yerase_bingo_bot/g, 'YerasegameBot');
tgPy = tgPy.replace(/one_day_82/g, 'Agegnewu0102');
tgPy = tgPy.replace(/@Yerasegame\b/g, '@YerasegameBot');
tgPy = tgPy.replace(/10 ብር የነፃ ቦነስ/g, '5 ETB Free Play Bonus');
tgPy = tgPy.replace(/10 ETB/g, '5 ETB');
fs.writeFileSync(tgPyPath, tgPy, 'utf8');
console.log('[✓] telegram_bot.py handles and bonuses updated');

// ==========================================
// 4. INDEX.HTML COMPREHENSIVE FIXES
// ==========================================
let html = fs.readFileSync(indexPath, 'utf8');

// A. Replace all old links and handles
html = html.replace(/https:\/\/t\.me\/yerase_bingo_bot/g, 'https://t.me/YerasegameBot');
html = html.replace(/https:\/\/t\.me\/one_day_82/g, 'https://t.me/Agegnewu0102');
html = html.replace(/@one_day_82/g, '@Agegnewu0102');
html = html.replace(/https:\/\/t\.me\/Yerasegame\b/g, 'https://t.me/YerasegameBot');

// B. Hide tg-only-overlay completely and prevent it from appearing inside Telegram
html = html.replace(
  '<div class="tg-only-modal" id="tg-only-overlay" style="display:none;">',
  '<div class="tg-only-modal" id="tg-only-overlay" style="display:none !important;">'
);
// In initTelegram(), NEVER set tgOverlay.style.display = 'flex'
html = html.replace(
  "var tgOverlay = document.getElementById('tg-only-overlay');\n      if (tgOverlay) tgOverlay.style.display = 'flex';",
  "var tgOverlay = document.getElementById('tg-only-overlay');\n      if (tgOverlay) tgOverlay.style.display = 'none';"
);

// C. Remove "Live Synchronized Bingo" subtitle from Home
html = html.replace(
  '<div class="stake-brand-amharic" id="lbl-stake-brand-subtitle" style="font-size:13px; font-weight:700; color:var(--muted); margin-top:4px; letter-spacing:0.3px;">Live Synchronized Bingo</div>',
  '<div class="stake-brand-amharic" id="lbl-stake-brand-subtitle" style="display:none;"></div>'
);

// D. Make Play 10 Birr and Play 20 Birr buttons large, wide, bold, and prominent
const oldStakeBox = `<div class="stake-box" style="display:flex; flex-direction:column; gap:14px; width:100%; max-width:440px; margin:20px auto; padding:0 4px;">
        <button class="room-pick-btn" onclick="selectStake(10)">
          <span id="lbl-room-pick-10">Play 10 Birr</span>
          <i class="fa-solid fa-arrow-right"></i>
        </button>
        <button class="room-pick-btn" onclick="selectStake(20)">
          <span id="lbl-room-pick-20">Play 20 Birr</span>
          <i class="fa-solid fa-arrow-right"></i>
        </button>`;

const newStakeBox = `<div class="stake-box" style="display:flex; flex-direction:column; gap:16px; width:100%; max-width:100%; margin:20px auto; padding:0 6px; box-sizing:border-box;">
        <button class="room-pick-btn" onclick="selectStake(10)" style="width:100% !important; padding:22px 20px !important; font-size:22px !important; font-weight:900 !important; border-radius:18px !important; background:linear-gradient(135deg, rgba(38, 20, 64, 0.98) 0%, rgba(20, 10, 36, 0.99) 100%) !important; border:2px solid rgba(230, 199, 135, 0.45) !important; box-shadow:0 10px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(124, 58, 237, 0.25) !important; display:flex !important; align-items:center !important; justify-content:space-between !important; cursor:pointer !important;">
          <div style="display:flex; align-items:center; gap:14px;">
            <div style="width:46px; height:46px; border-radius:14px; background:rgba(230, 199, 135, 0.15); border:1.5px solid rgba(230, 199, 135, 0.4); display:flex; align-items:center; justify-content:center; color:var(--gold); font-size:20px;">
              <i class="fa-solid fa-play"></i>
            </div>
            <span id="lbl-room-pick-10" style="color:#FFF4D9; letter-spacing:0.5px;">Play 10 Birr</span>
          </div>
          <i class="fa-solid fa-arrow-right" style="color:var(--gold); font-size:18px;"></i>
        </button>
        <button class="room-pick-btn" onclick="selectStake(20)" style="width:100% !important; padding:22px 20px !important; font-size:22px !important; font-weight:900 !important; border-radius:18px !important; background:linear-gradient(135deg, rgba(38, 20, 64, 0.98) 0%, rgba(20, 10, 36, 0.99) 100%) !important; border:2px solid rgba(230, 199, 135, 0.45) !important; box-shadow:0 10px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(124, 58, 237, 0.25) !important; display:flex !important; align-items:center !important; justify-content:space-between !important; cursor:pointer !important;">
          <div style="display:flex; align-items:center; gap:14px;">
            <div style="width:46px; height:46px; border-radius:14px; background:rgba(230, 199, 135, 0.15); border:1.5px solid rgba(230, 199, 135, 0.4); display:flex; align-items:center; justify-content:center; color:var(--gold); font-size:20px;">
              <i class="fa-solid fa-forward-step"></i>
            </div>
            <span id="lbl-room-pick-20" style="color:#FFF4D9; letter-spacing:0.5px;">Play 20 Birr</span>
          </div>
          <i class="fa-solid fa-arrow-right" style="color:var(--gold); font-size:18px;"></i>
        </button>`;

if (html.includes(oldStakeBox)) {
  html = html.replace(oldStakeBox, newStakeBox);
  console.log('[✓] Replaced stake box with large, wide, bold buttons');
}

// E. Remove "WATCH LIVE GAME" button from renderSelectedCardsPreview()
const oldWatchBtnHtml = `<div style="margin-top:12px;">' +
        '<button type="button" onclick="spectateLiveGame()" style="background:linear-gradient(135deg, rgba(124, 58, 237, 0.4) 0%, rgba(59, 7, 100, 0.6) 100%); border:1.5px solid rgba(230, 199, 135, 0.5); color:#FFF4D9; padding:11px 22px; border-radius:12px; font-size:13px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:8px; box-shadow:0 4px 16px rgba(0,0,0,0.5);">' +
          '<i class="fa-solid fa-eye" style="color:#E6C787;"></i> ' + watchBtnText +
        '</button>' +
      '</div>`;

if (html.includes(oldWatchBtnHtml)) {
  html = html.replace(oldWatchBtnHtml, '');
  console.log('[✓] Removed WATCH LIVE GAME button from cartela preview');
}

// F. In startTimer(), automatically call startGame() when timeLeft <= 0 if cards are selected
const oldTimerExpired = `    if(timeLeft<=0){
      clearInterval(timerIv);
      timerIv=null;
      if (selCards.size >= 1 && !hasBoughtTicket) {
        buyTicket();
      }
    }`;

const newTimerExpired = `    if(timeLeft<=0){
      clearInterval(timerIv);
      timerIv=null;
      if (selCards.size >= 1) {
        startGame();
      } else {
        spectateLiveGame();
      }
    }`;

if (html.includes(oldTimerExpired)) {
  html = html.replace(oldTimerExpired, newTimerExpired);
  console.log('[✓] Fixed startTimer expiration: triggers startGame() when cards selected');
}

// G. In startGame(), prevent double deduction if cards were already deducted
const oldStartGameDeduct = `  var betAmount=cardNums.length*currentStake;
  var deducted=await deductBet(betAmount);
  if(!deducted){
    startTimer();
    return;
  }`;

const newStartGameDeduct = `  var betAmount=cardNums.length*currentStake;
  if (!game.betDeducted) {
    var deducted=await deductBet(betAmount);
    if(!deducted){
      startTimer();
      return;
    }
    game.betDeducted = true;
  }`;

if (html.includes(oldStartGameDeduct)) {
  html = html.replace(oldStartGameDeduct, newStartGameDeduct);
  console.log('[✓] Prevented double deduction in startGame');
}

// H. WITHDRAWAL MODAL: Bank Selector (CBE & Telebirr ONLY) & Confirmation Flow
const oldWithdrawModalBody = `<div class="input-group" style="margin-bottom:12px;">
          <label id="lbl-with-amount-label">WITHDRAW AMOUNT - Min 150 Br</label>
          <div class="input-wrap">
            <input type="number" id="with-req-amount" class="auth-input" placeholder="150" min="150" value="150" onkeydown="if(event.key === 'Enter') submitClientWithdraw()">
          </div>
        </div>
        
        <div class="input-group" style="margin-bottom:16px;">
          <label id="lbl-with-phone-label">RECEIVER ACCOUNT / PHONE</label>
          <div class="input-wrap">
            <input type="text" id="with-req-phone" class="auth-input" placeholder="09xxxxxxxx" onkeydown="if(event.key === 'Enter') submitClientWithdraw()">
          </div>
        </div>
        
        <button class="auth-btn" id="lbl-with-submit-btn" style="background-color:#ef4444;" onclick="submitClientWithdraw()">SUBMIT WITHDRAWAL REQUEST</button>`;

const newWithdrawModalBody = `<!-- Payout Method Selection: CBE vs Telebirr -->
        <div style="width:100%; margin-bottom:14px; text-align:left;">
          <label style="font-size:11px; font-weight:800; color:var(--muted); text-transform:uppercase; margin-bottom:6px; display:block;">SELECT PAYOUT METHOD</label>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
            <button type="button" id="with-btn-cbe" onclick="selectWithdrawBank('cbe')" style="padding:10px 8px; border-radius:12px; background:rgba(124,58,237,0.25); border:2px solid var(--purple-light); color:#fff; font-size:12px; font-weight:800; cursor:pointer; display:flex; flex-direction:column; align-items:center; gap:4px;">
              <i class="fa-solid fa-building-columns" style="font-size:16px; color:var(--gold);"></i>
              <span>CBE (ንግድ ባንክ)</span>
            </button>
            <button type="button" id="with-btn-telebirr" onclick="selectWithdrawBank('telebirr')" style="padding:10px 8px; border-radius:12px; background:rgba(255,255,255,0.05); border:1.5px solid rgba(255,255,255,0.15); color:var(--muted); font-size:12px; font-weight:800; cursor:pointer; display:flex; flex-direction:column; align-items:center; gap:4px;">
              <i class="fa-solid fa-mobile-screen-button" style="font-size:16px; color:#60a5fa;"></i>
              <span>Telebirr (ቴሌብር)</span>
            </button>
          </div>
        </div>

        <div class="input-group" style="margin-bottom:12px;">
          <label id="lbl-with-amount-label">WITHDRAW AMOUNT - Min 150 Br</label>
          <div class="input-wrap">
            <input type="number" id="with-req-amount" class="auth-input" placeholder="150" min="150" value="150">
          </div>
        </div>
        
        <div class="input-group" style="margin-bottom:16px;">
          <label id="lbl-with-account-label">CBE ACCOUNT NUMBER (13 Digits)</label>
          <div class="input-wrap">
            <input type="text" id="with-req-phone" class="auth-input" placeholder="1000xxxxxxxx">
          </div>
        </div>
        
        <button class="auth-btn" id="lbl-with-submit-btn" style="background:linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);" onclick="confirmWithdrawPrompt()">CONFIRM & SUBMIT WITHDRAWAL</button>`;

if (html.includes(oldWithdrawModalBody)) {
  html = html.replace(oldWithdrawModalBody, newWithdrawModalBody);
  console.log('[✓] Updated withdraw modal with CBE & Telebirr selectors and confirmation');
}

// I. Add Bank Selector & Confirm logic functions
const bankHelperFunctions = `
var selectedWithdrawMethod = 'cbe';

function selectWithdrawBank(method) {
  selectedWithdrawMethod = method;
  var btnCbe = document.getElementById('with-btn-cbe');
  var btnTele = document.getElementById('with-btn-telebirr');
  var lblAcc = document.getElementById('lbl-with-account-label');
  var inpAcc = document.getElementById('with-req-phone');
  var isAm = (currentRulesLang === 'am');

  if (method === 'cbe') {
    if (btnCbe) { btnCbe.style.background = 'rgba(124,58,237,0.25)'; btnCbe.style.border = '2px solid var(--purple-light)'; btnCbe.style.color = '#fff'; }
    if (btnTele) { btnTele.style.background = 'rgba(255,255,255,0.05)'; btnTele.style.border = '1.5px solid rgba(255,255,255,0.15)'; btnTele.style.color = 'var(--muted)'; }
    if (lblAcc) lblAcc.textContent = isAm ? 'የንግድ ባንክ ሂሳብ ቁጥር (CBE Account - 13 Digits)' : 'CBE ACCOUNT NUMBER (13 Digits)';
    if (inpAcc) inpAcc.placeholder = '1000xxxxxxxx';
  } else {
    if (btnTele) { btnTele.style.background = 'rgba(37,99,235,0.25)'; btnTele.style.border = '2px solid #60a5fa'; btnTele.style.color = '#fff'; }
    if (btnCbe) { btnCbe.style.background = 'rgba(255,255,255,0.05)'; btnCbe.style.border = '1.5px solid rgba(255,255,255,0.15)'; btnCbe.style.color = 'var(--muted)'; }
    if (lblAcc) lblAcc.textContent = isAm ? 'የቴሌብር ስልክ ቁጥር (Telebirr Phone - 09xxxxxxxx)' : 'TELEBIRR PHONE NUMBER (09xxxxxxxx)';
    if (inpAcc) inpAcc.placeholder = '09xxxxxxxx';
  }
}

async function confirmWithdrawPrompt() {
  if (soundOn) sfx.playClick();
  var isAm = (currentRulesLang === 'am');
  var amt = parseFloat(document.getElementById('with-req-amount').value) || 0;
  var acc = (document.getElementById('with-req-phone').value || '').trim();

  if (amt < 150) {
    var errMin = isAm ? 'ዝቅተኛው የማውጣት መጠን 150 ብር ነው!' : 'Minimum withdrawal amount is 150 ETB!';
    if (apiAvailable) Telegram.WebApp.showAlert(errMin); else alert(errMin);
    return;
  }
  if (!acc || acc.length < 9) {
    var errAcc = isAm ? 'እባክዎ ትክክለኛ የሂሳብ ወይም የስልክ ቁጥር ያስገቡ!' : 'Please enter a valid account or phone number!';
    if (apiAvailable) Telegram.WebApp.showAlert(errAcc); else alert(errAcc);
    return;
  }
  if (amt > userMainBalance) {
    var errBal = isAm ? 'በቂ ተቀማጭ ዋና ሂሳብ የለዎትም!' : 'Insufficient withdrawable main balance!';
    if (apiAvailable) Telegram.WebApp.showAlert(errBal); else alert(errBal);
    return;
  }

  var bankName = selectedWithdrawMethod === 'cbe' ? 'Commercial Bank of Ethiopia (CBE)' : 'Telebirr';
  var confirmMsg = isAm
    ? ('እባክዎ የወጪ ማረጋገጫ ዝርዝሮችን ያረጋግጡ፦\\n\\n' +
       '• ዘዴ፦ ' + bankName + '\\n' +
       '• መጠን፦ ' + amt + ' ብር\\n' +
       '• ተቀባይ ቁጥር፦ ' + acc + '\\n\\n' +
       'ጥያቄውን ማስተላለፍ ይፈልጋሉ?')
    : ('Please confirm your withdrawal details:\\n\\n' +
       '• Method: ' + bankName + '\\n' +
       '• Amount: ' + amt + ' ETB\\n' +
       '• Destination: ' + acc + '\\n\\n' +
       'Proceed with this request?');

  if (confirm(confirmMsg)) {
    submitClientWithdrawWithMethod(selectedWithdrawMethod, amt, acc);
  }
}

async function submitClientWithdrawWithMethod(method, amt, acc) {
  var isAm = (currentRulesLang === 'am');
  try {
    var res = await fetch(API_BASE + '/api/client/withdraw', {
      method: 'POST',
      headers: apiHeaders,
      body: JSON.stringify({
        user_id: tgUserId,
        amount: amt,
        phone: acc,
        method: method
      })
    });
    var data = await res.json();
    if (data.success) {
      userMainBalance = data.new_balance;
      updateBalanceDisplay();
      closeClientWithdrawModal();
      var okMsg = isAm
        ? 'የወጪ ጥያቄዎ በተሳካ ሁኔታ ተላልፏል! አስተዳዳሪው አረጋግጦ ወዲያውኑ ወደ ' + (method === 'cbe' ? 'ንግድ ባንክ' : 'ቴሌብር') + ' ያስተላልፍልዎታል።'
        : 'Withdrawal request submitted! Our admin team will verify and transfer ' + amt + ' ETB to your ' + (method === 'cbe' ? 'CBE' : 'Telebirr') + ' account shortly.';
      if (apiAvailable) Telegram.WebApp.showAlert(okMsg); else alert(okMsg);
      if (typeof loadWallet === 'function') loadWallet();
    } else {
      var failMsg = data.error || (isAm ? 'ጥያቄውን ማስተላለፍ አልተቻለም።' : 'Failed to process request.');
      if (apiAvailable) Telegram.WebApp.showAlert(failMsg); else alert(failMsg);
    }
  } catch(e) {
    alert(isAm ? 'የሰርቨር ግንኙነት ችግር። እባክዎ እንደገና ይሞክሩ።' : 'Network error. Please try again.');
  }
}
`;

if (!html.includes('function selectWithdrawBank')) {
  html = html.replace('function submitClientWithdraw()', bankHelperFunctions + '\nfunction submitClientWithdraw()');
  console.log('[✓] Added bank helper and confirmation functions');
}

fs.writeFileSync(indexPath, html, 'utf8');
console.log('[✓] index.html updated successfully!');
console.log('=== ALL COMPREHENSIVE FIXES COMPLETE ===');
