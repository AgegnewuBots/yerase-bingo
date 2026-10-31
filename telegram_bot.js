// ============================================================================
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
      `✅ *Phone Number Verified Successfully!*\n\n` +
      `Welcome, ${firstName}! Your phone number (${phone}) is now linked to your account.\n\n` +
      `• 200 ETB Free Welcome Bonus is ready in your account!\n` +
      `• Use the interactive menu below to play, view your balance, deposit, or withdraw funds 👇`;

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
      `🎮 *Welcome to Yerase Bingo!*\n\n` +
      `Ethiopia's premier live multiplayer Bingo gaming platform on Telegram.\n\n` +
      `*Key Features:*\n` +
      `• Synchronized 10 ETB & 20 ETB live rooms\n` +
      `• Instant deposits & withdrawals via Telebirr & CBE\n` +
      `• 200 ETB Free Welcome Bonus for every new player\n` +
      `• 5 ETB Free Play Bonus for every friend you invite\n` +
      `• Provably fair live ball drawing and instant cashouts\n\n` +
      (hasPhone 
        ? `Please choose an option from the menu below to get started 👇` 
        : `Please share your phone number below to verify your account and claim your 200 ETB welcome bonus 👇`);

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
      text: `📋 *Yerase Bingo Main Menu*\nChoose an option from the keyboard below:`,
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
      `💰 *Your Account Balance Summary*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `• *Withdrawable Main Balance:* ${mainBal} ETB\n` +
      `• *Free Play Bonus Balance:* ${playBal} ETB\n` +
      `• *Total Balance:* ${totBal} ETB\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `💡 *Winnings from your play bonus are 100% withdrawable once wagering requirements are met!*`;

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
      `📥 *Deposit Funds to Yerase Bingo*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `*Minimum Deposit Amount:* 50 ETB\n\n` +
      `*1. Telebirr:*\n` +
      `   • Phone Number: 09104440496\n` +
      `   • Account Name: Yerase Bingo\n\n` +
      `*2. Commercial Bank of Ethiopia (CBE):*\n` +
      `   • CBE Account: 1000123456789\n` +
      `   • Account Name: Yerase Bingo\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `*How to Complete Deposit:*\n` +
      `Transfer funds via Telebirr or CBE, then tap *"Open Deposit in App"* below to submit your transaction screenshot or SMS reference. Funds are credited instantly!`;

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
      `📤 *Withdraw Funds*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `• *Your Withdrawable Balance:* ${mainBal} ETB\n` +
      `• *Minimum Withdrawal Amount:* 150 ETB\n` +
      `• *Supported Payout Methods:* Commercial Bank of Ethiopia (CBE) & Telebirr\n` +
      `*(Note: CBE Birr is not supported — use CBE Account or Telebirr)*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `*Withdrawal Policy:*\n` +
      `Deposited funds and winnings become withdrawable once you deposit at least 50 ETB and wager 15x your total deposit amount.\n\n` +
      `Tap *"Open Withdrawal in App"* below to select your payout method (CBE or Telebirr) and submit your request 👇`;

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
    const refLink = `https://t.me/YerasegameBot?start=${userId}`;
    const shareText = encodeURIComponent(`Play Yerase Bingo on Telegram! Get 200 ETB free welcome bonus! 👉 ${refLink}`);

    const inviteMsg = 
      `👥 *Invite Friends & Earn Free Play Bonus*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `*Your Personal Referral Link:*\n` +
      refLink + '\n\n' +
      `• *Total Friends Invited:* ${refCount} players\n` +
      `• *Referral Reward:* Earn *5 ETB Free Play Bonus* for every friend who joins!\n` +
      `• *Usage:* Bonus funds are added directly to your play balance to win real prizes!\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Share your invite link to Telegram groups and friends now 👇`;

    await sendApiRequest('sendMessage', {
      chat_id: chatId,
      text: inviteMsg,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🚀 Share Invite Link', url: `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${shareText}` }],
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
      `👤 *Player Profile Card*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `• *Player Name:* ${liveUser.first_name || firstName}\n` +
      `• *Telegram Username:* ${handle}\n` +
      '• *Profile ID:* ' + idFormatted + '\n' +
      '• *Phone Number:* ' + phoneDisplay + '\n' +
      `• *Games Played:* ${liveUser.games_played || 0}\n` +
      `• *Games Won:* ${liveUser.games_won || 0}\n` +
      `• *Total Won:* ${(liveUser.total_won || 0).toFixed(2)} ETB\n` +
      `• *Member Tier:* ${liveUser.is_vip ? 'VIP Member' : 'Standard Member'}\n` +
      `━━━━━━━━━━━━━━━━━━━━`;

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
      `📞 *Customer Support & Official Channel*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Have questions, payment inquiries, or feedback? Contact our team 24/7:\n\n` +
      `• *Telegram Support:* @Agegnewu0102\n` +
      `• *Official Channel:* @yerasebingo\n` +
      `• *Official Bot:* @YerasegameBot\n` +
      `━━━━━━━━━━━━━━━━━━━━`;

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
      text: `🎮 *Play Yerase Bingo Live Now!*\nTap below to launch the Mini App:`,
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
    text: `Hello ${firstName}! Please choose an option from the menu below 👇`,
    reply_markup: getMainMenuKeyboard()
  });
}

function getRulesText() {
  return `📖 *How to Play Yerase Bingo*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `1. *Select a Room:* Choose the 10 ETB or 20 ETB live room.\n` +
    `2. *Pick Cartelas:* Select up to 2 lucky cartelas before the 60-second round countdown ends.\n` +
    `3. *Live Ball Calls:* Numbers from 1 to 75 are drawn randomly by the server. Your cards auto-daub called numbers in real time!\n` +
    `4. *Winning BINGO:* Complete any horizontal, vertical, diagonal line, or 4 corners to hit BINGO and claim the prize pot!\n` +
    `━━━━━━━━━━━━━━━━━━━━`;
}

function getInfoText() {
  return `ℹ️ *Yerase Bingo Platform Info*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `• *Fair & Transparent:* Provably fair deterministic card numbers and server-side ball calling.\n` +
    `• *Secure Banking:* Direct deposit and withdrawal verification via CBE & Telebirr.\n` +
    `• *Bonus System:* 200 ETB free welcome bonus + 5 ETB free bonus for each friend invited.\n` +
    `• *Official Bot:* @YerasegameBot\n` +
    `• *Customer Support:* @Agegnewu0102\n` +
    `• *Official Community Channel:* @yerasebingo\n` +
    `━━━━━━━━━━━━━━━━━━━━`;
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
      console.log(`[Telegram Bot] Connected successfully as @${me.result.username} (${me.result.first_name})`);
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
