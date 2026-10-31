const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');
const tgBotPath = path.join(__dirname, '..', 'telegram_bot.js');
const tgPyPath = path.join(__dirname, '..', 'telegram_bot.py');

let html = fs.readFileSync(indexPath, 'utf8');
let tgBot = fs.readFileSync(tgBotPath, 'utf8');
let tgPy = fs.readFileSync(tgPyPath, 'utf8');

console.log('--- STARTING COMPREHENSIVE FIXES ---');

// ==========================================
// 1. UPDATE TELEGRAM BOT (JS & PY) DEEP LINKS
// ==========================================
// In telegram_bot.js:
tgBot = tgBot.replace(
  "[{ text: '📥 Open Deposit in App', web_app: { url: WEBAPP_URL } }]",
  "[{ text: '📥 Open Deposit in App', web_app: { url: WEBAPP_URL + (WEBAPP_URL.includes('?') ? '&' : '?') + 'action=deposit' } }]"
);
tgBot = tgBot.replace(
  "[{ text: '📤 Open Withdrawal in App', web_app: { url: WEBAPP_URL } }]",
  "[{ text: '📤 Open Withdrawal in App', web_app: { url: WEBAPP_URL + (WEBAPP_URL.includes('?') ? '&' : '?') + 'action=withdraw' } }]"
);
fs.writeFileSync(tgBotPath, tgBot, 'utf8');
console.log('[✓] Updated telegram_bot.js deep links for Deposit & Withdraw');

// In telegram_bot.py:
tgPy = tgPy.replace(
  '[InlineKeyboardButton("📥 Open Deposit in App", web_app=WebAppInfo(url=WEBAPP_URL))]',
  '[InlineKeyboardButton("📥 Open Deposit in App", web_app=WebAppInfo(url=WEBAPP_URL + ("&" if "?" in WEBAPP_URL else "?") + "action=deposit"))]'
);
tgPy = tgPy.replace(
  '[InlineKeyboardButton("📤 Open Withdrawal in App", web_app=WebAppInfo(url=WEBAPP_URL))]',
  '[InlineKeyboardButton("📤 Open Withdrawal in App", web_app=WebAppInfo(url=WEBAPP_URL + ("&" if "?" in WEBAPP_URL else "?") + "action=withdraw"))]'
);
fs.writeFileSync(tgPyPath, tgPy, 'utf8');
console.log('[✓] Updated telegram_bot.py deep links for Deposit & Withdraw');


// ==========================================
// 2. FULL-WIDTH VIEWPORT CSS (ELIMINATE SIDE GAPS)
// ==========================================
const oldAppCss = `.app {
  max-width: 540px !important;
  width: 100% !important;
  margin: 0 auto !important;
  min-height: 100vh !important;
  display: flex !important;
  flex-direction: column !important;
  position: relative !important;
  padding-top: calc(var(--topbar-height) + 12px) !important;
  padding-bottom: calc(var(--bottomnav-height) + 18px) !important;
  box-sizing: border-box !important;
}`;

const newAppCss = `.app {
  width: 100% !important;
  max-width: 100% !important;
  margin: 0 !important;
  min-height: 100vh !important;
  display: flex !important;
  flex-direction: column !important;
  position: relative !important;
  padding-top: 0 !important;
  padding-bottom: calc(var(--bottomnav-height) + 14px) !important;
  padding-left: 0 !important;
  padding-right: 0 !important;
  box-sizing: border-box !important;
}

/* Ensure all screens take full width edge-to-edge without awkward margins */
.screen {
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
  padding: 8px 12px 24px !important;
}

#screen-stake {
  padding-top: 4px !important;
}

#screen-game {
  width: 100% !important;
  max-width: 100% !important;
  overflow-y: auto !important;
  -webkit-overflow-scrolling: touch !important;
  padding: 6px 8px 30px !important;
  display: none;
  flex-direction: column !important;
}

#screen-game.active {
  display: flex !important;
}

#screen-game .main {
  display: flex !important;
  flex-direction: column !important;
  width: 100% !important;
  overflow: visible !important;
  gap: 12px !important;
}

#screen-game .left-col,
#screen-game .right-col {
  width: 100% !important;
  max-width: 100% !important;
  overflow: visible !important;
  min-width: 0 !important;
  padding: 0 !important;
}

#screen-game .card-box {
  width: 100% !important;
  box-sizing: border-box !important;
  margin-top: 8px !important;
  margin-bottom: 12px !important;
}

@media (min-width: 768px) {
  #screen-game .main {
    flex-direction: row !important;
    align-items: flex-start !important;
  }
  #screen-game .left-col {
    flex: 1 !important;
  }
  #screen-game .right-col {
    width: 380px !important;
  }
}`;

if (html.includes(oldAppCss)) {
  html = html.replace(oldAppCss, newAppCss);
  console.log('[✓] Replaced .app CSS with full-width responsive CSS');
} else {
  console.log('[!] Exact oldAppCss match failed, appending newAppCss before </style>');
  html = html.replace('</style>', newAppCss + '\n</style>');
}


// ==========================================
// 3. TOPBAR ONLY ON HOME SCREEN ('screen-stake')
// ==========================================
const oldShowScreen = `function showScreen(id) {
  triggerHaptic('selection');
  document.querySelectorAll('.screen').forEach(function(s) {
    s.classList.remove('active');
  });
  var target = document.getElementById(id);
  if (target) {
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  var topbar = document.getElementById('home-topbar-card');
  var nav = document.getElementById('bottom-nav');
  var appEl = document.querySelector('.app');
  
  if (id === 'screen-game' || id === 'screen-winner' || id === 'screen-home') {
    document.body.classList.add('in-room-mode');
    if (nav) {
      nav.classList.add('room-hidden');
      nav.style.setProperty('display', 'none', 'important');
    }
    if (topbar) {
      topbar.classList.add('room-hidden');
      topbar.style.setProperty('display', 'none', 'important');
    }
    if (appEl) appEl.classList.add('in-game-mode');
  } else {
    document.body.classList.remove('in-room-mode');
    if (nav) {
      nav.classList.remove('room-hidden');
      nav.style.setProperty('display', 'flex', 'important');
    }
    if (topbar) {
      topbar.classList.remove('room-hidden');
      topbar.style.setProperty('display', 'flex', 'important');
    }
    if (appEl) appEl.classList.remove('in-game-mode');
  }

  if (id === 'screen-home') {
    var titleEl = document.getElementById('room-header-title');
    if (titleEl) titleEl.textContent = 'Play ' + (currentStake || 10) + ' Birr';
    var rBal = document.getElementById('room-bal-display');
    if (rBal) rBal.textContent = (userMainBalance + userPlayBalance).toFixed(2) + ' Br';
  }
}`;

const newShowScreen = `function showScreen(id) {
  triggerHaptic('selection');
  document.querySelectorAll('.screen').forEach(function(s) {
    s.classList.remove('active');
  });
  var target = document.getElementById(id);
  if (target) {
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  var topbar = document.getElementById('home-topbar-card');
  var nav = document.getElementById('bottom-nav');
  var appEl = document.querySelector('.app');
  
  // 1. Home Top Bar visibility: ONLY ON HOME SCREEN ('screen-stake')!
  if (id === 'screen-stake') {
    if (topbar) {
      topbar.classList.remove('room-hidden');
      topbar.style.setProperty('display', 'flex', 'important');
    }
  } else {
    if (topbar) {
      topbar.classList.add('room-hidden');
      topbar.style.setProperty('display', 'none', 'important');
    }
  }

  // 2. Bottom Nav visibility: Show on home, winners, wallet, profile; Hide in game/room
  if (id === 'screen-game' || id === 'screen-winner' || id === 'screen-home' || id === 'screen-create-password') {
    document.body.classList.add('in-room-mode');
    if (nav) {
      nav.classList.add('room-hidden');
      nav.style.setProperty('display', 'none', 'important');
    }
    if (appEl) appEl.classList.add('in-game-mode');
  } else {
    document.body.classList.remove('in-room-mode');
    if (nav) {
      nav.classList.remove('room-hidden');
      nav.style.setProperty('display', 'flex', 'important');
    }
    if (appEl) appEl.classList.remove('in-game-mode');
  }

  if (id === 'screen-home') {
    var rBal = document.getElementById('room-bal-display');
    var isAm = (currentRulesLang === 'am');
    if (rBal) rBal.textContent = (userMainBalance + userPlayBalance).toFixed(2) + (isAm ? ' ብር' : ' ETB');
  }
  if (id === 'screen-game') {
    var gBal = document.getElementById('game-bal-display');
    var isAm = (currentRulesLang === 'am');
    if (gBal) gBal.textContent = (userMainBalance + userPlayBalance).toFixed(2) + (isAm ? ' ብር' : ' ETB');
  }
}`;

if (html.includes(oldShowScreen)) {
  html = html.replace(oldShowScreen, newShowScreen);
  console.log('[✓] Updated showScreen function: Home Top Bar only visible on screen-stake');
} else {
  console.log('[!] showScreen exact match failed, attempting regex replace...');
  html = html.replace(/function showScreen\(id\)\s*\{[\s\S]*?if\s*\(id\s*===\s*'screen-home'\)[\s\S]*?\}\s*\}/, newShowScreen);
}


// ==========================================
// 4. FIX navTo (DO NOT BLOCK WHEN !tgUserId)
// ==========================================
const oldNavTo = `function navTo(tab){
  if (!tgUserId) {
    showScreen('screen-stake');
    return;
  }
  if (soundOn) sfx.playClick();
  ['home','profile','winners','wallet'].forEach(function(t){document.getElementById('nav-'+t).classList.toggle('active',t===tab);});
  var map={home:'screen-stake',profile:'screen-profile',winners:'screen-winners',wallet:'screen-wallet'};
  var screenId = map[tab];
  if(screenId) {
    showScreen(screenId);
  }
  if(tab==='profile')loadProfile();
  if(tab==='winners')loadLeaderboard();
  if(tab==='wallet')loadWallet();
}`;

const newNavTo = `function navTo(tab){
  if (soundOn) sfx.playClick();
  ['home','profile','winners','wallet'].forEach(function(t){
    var el = document.getElementById('nav-' + t);
    if (el) el.classList.toggle('active', t === tab);
  });
  var map = { home: 'screen-stake', profile: 'screen-profile', winners: 'screen-winners', wallet: 'screen-wallet' };
  var screenId = map[tab];
  if (screenId) {
    showScreen(screenId);
  }
  if (tab === 'profile') loadProfile();
  if (tab === 'winners') loadLeaderboard();
  if (tab === 'wallet') loadWallet();
  if (tab === 'home') fetchBalance();
}`;

if (html.includes(oldNavTo)) {
  html = html.replace(oldNavTo, newNavTo);
  console.log('[✓] Updated navTo function: Unlocked all tabs smoothly');
} else {
  console.log('[!] oldNavTo exact match failed, attempting regex replace...');
  html = html.replace(/function navTo\(tab\)\s*\{[\s\S]*?if\s*\(tab==='wallet'\)\s*loadWallet\(\);\s*\}/, newNavTo);
}


// ==========================================
// 5. UPDATE ROOM HEADER IN screen-home (REMOVE "Play 10 Birr" & CLEAN BACK + BAL)
// ==========================================
const oldRoomHeaderBar = `<div class="room-header-bar">
        <button class="room-back-btn" onclick="backToStake()">
          <i class="fa-solid fa-arrow-left" style="color:#E6C787;"></i>
          <span id="lbl-room-back-btn">Home</span>
        </button>
        <div class="room-badge-pill" id="room-header-title">Play 10 Birr</div>
        <div class="room-balance-pill" onclick="openClientDepositModal()" title="Add balance">
          <i class="fa-solid fa-wallet" style="color:#E6C787; font-size:12px;"></i>
          <span style="font-size:12px; font-weight:800; color:#FFF4D9;" id="room-bal-display">200.00 ETB</span>
          <span style="background:var(--gold-gradient); color:#120824; border-radius:5px; padding:2px 6px; font-size:10px; font-weight:900;">+</span>
        </div>
      </div>`;

const newRoomHeaderBar = `<div class="room-header-bar" style="display:flex; align-items:center; justify-content:space-between; width:100%; padding:8px 6px; box-sizing:border-box;">
        <button class="room-back-btn" onclick="backToStake()" style="background:rgba(255,255,255,0.08); border:1.5px solid rgba(230,199,135,0.3); border-radius:12px; padding:6px 14px; color:#FFF4D9; font-size:13px; font-weight:800; cursor:pointer; display:flex; align-items:center; gap:8px;">
          <i class="fa-solid fa-arrow-left" style="color:#E6C787;"></i>
          <span id="lbl-room-back-btn">Home</span>
        </button>
        <div class="room-balance-pill" onclick="openClientDepositModal()" title="Add balance" style="background:rgba(24,12,42,0.85); border:1.5px solid rgba(230,199,135,0.3); border-radius:12px; padding:6px 12px; display:flex; align-items:center; gap:8px; cursor:pointer;">
          <i class="fa-solid fa-wallet" style="color:#E6C787; font-size:13px;"></i>
          <span style="font-size:12.5px; font-weight:900; color:#FFF4D9;" id="room-bal-display">200.00 ETB</span>
          <span style="background:var(--gold-gradient); color:#120824; border-radius:6px; padding:2px 6px; font-size:10px; font-weight:900;">+</span>
        </div>
      </div>`;

if (html.includes(oldRoomHeaderBar)) {
  html = html.replace(oldRoomHeaderBar, newRoomHeaderBar);
  console.log('[✓] Updated screen-home header: Clean Home back button and Balance display');
} else {
  console.log('[!] oldRoomHeaderBar exact match failed');
}


// ==========================================
// 6. ADD DEDICATED TOP HEADER TO screen-game
// ==========================================
const oldScreenGameTop = `<div class="screen" id="screen-game">
    <div id="spectator-banner" style="display:none; background: linear-gradient(90deg, #d84315 0%, #ff8f00 100%); color: #fff; padding: 8px 12px; font-size: 13px; font-weight: 700; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1); flex-shrink: 0; box-shadow: 0 4px 12px rgba(216,67,21,0.3); z-index: 50; align-items:center; justify-content:center; gap:8px;">
      <i class="fa-solid fa-circle-exclamation"></i>
      <span id="lbl-spec-banner-text">You didn't join this round. Watching live...</span>
      <button onclick="navTo('home')" style="background:rgba(0,0,0,0.35); border:1px solid rgba(255,255,255,0.7); color:#fff; border-radius:8px; padding:4px 10px; font-size:11px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:5px; margin-left:6px; transition:transform 0.15s ease;"><i class="fa-solid fa-arrow-left"></i> <span id="lbl-spec-banner-btn">Home</span></button>
    </div>
    <div class="topbar">`;

const newScreenGameTop = `<div class="screen" id="screen-game">
    <!-- Dedicated In-Game Top Bar with Home Back Button and Balance -->
    <div class="room-header-bar" style="display:flex; align-items:center; justify-content:space-between; width:100%; padding:8px 4px; box-sizing:border-box; margin-bottom:6px;">
      <button class="room-back-btn" onclick="leaveGameView()" style="background:rgba(255,255,255,0.08); border:1.5px solid rgba(230,199,135,0.3); border-radius:12px; padding:6px 14px; color:#FFF4D9; font-size:13px; font-weight:800; cursor:pointer; display:flex; align-items:center; gap:8px;">
        <i class="fa-solid fa-arrow-left" style="color:#E6C787;"></i>
        <span id="lbl-game-back-btn">Home</span>
      </button>
      <div class="room-balance-pill" onclick="openClientDepositModal()" title="Add balance" style="background:rgba(24,12,42,0.85); border:1.5px solid rgba(230,199,135,0.3); border-radius:12px; padding:6px 12px; display:flex; align-items:center; gap:8px; cursor:pointer;">
        <i class="fa-solid fa-wallet" style="color:#E6C787; font-size:13px;"></i>
        <span style="font-size:12.5px; font-weight:900; color:#FFF4D9;" id="game-bal-display">200.00 ETB</span>
      </div>
    </div>

    <div id="spectator-banner" style="display:none; background: linear-gradient(90deg, #d84315 0%, #ff8f00 100%); color: #fff; padding: 8px 12px; font-size: 13px; font-weight: 700; text-align: center; border-radius: 10px; margin-bottom: 8px; flex-shrink: 0; box-shadow: 0 4px 12px rgba(216,67,21,0.3); z-index: 50; align-items:center; justify-content:center; gap:8px;">
      <i class="fa-solid fa-circle-exclamation"></i>
      <span id="lbl-spec-banner-text">Watching live round...</span>
      <button onclick="leaveGameView()" style="background:rgba(0,0,0,0.35); border:1px solid rgba(255,255,255,0.7); color:#fff; border-radius:8px; padding:4px 10px; font-size:11px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:5px; margin-left:6px;"><i class="fa-solid fa-arrow-left"></i> <span>Home</span></button>
    </div>
    <div class="topbar">`;

if (html.includes(oldScreenGameTop)) {
  html = html.replace(oldScreenGameTop, newScreenGameTop);
  console.log('[✓] Added dedicated Top Header to screen-game with Home button & Balance');
} else {
  console.log('[!] oldScreenGameTop exact match failed, attempting regex replace...');
  html = html.replace(/<div class="screen" id="screen-game">\s*<div id="spectator-banner"[\s\S]*?<div class="topbar">/, newScreenGameTop);
}


// ==========================================
// 7. UPDATE updateBalanceDisplay TO REFRESH game-bal-display
// ==========================================
html = html.replace(
  "var roomBal = document.getElementById('room-bal-display');\n  if (roomBal) roomBal.textContent = totalFormatted + curr;",
  "var roomBal = document.getElementById('room-bal-display');\n  if (roomBal) roomBal.textContent = totalFormatted + curr;\n  var gameBal = document.getElementById('game-bal-display');\n  if (gameBal) gameBal.textContent = totalFormatted + curr;"
);


// ==========================================
// 8. DEEP LINK INITIALIZER IN initTelegram()
// ==========================================
const deepLinkCode = `
      // Deep-linking handler for direct deposit and withdrawal opens
      try {
        var urlParams = new URLSearchParams(window.location.search);
        var actParam = urlParams.get('action') || urlParams.get('startapp') || '';
        if (!actParam && window.location.hash) {
          actParam = window.location.hash.replace('#', '');
        }
        if (!actParam && wa && wa.initDataUnsafe && wa.initDataUnsafe.start_param) {
          actParam = wa.initDataUnsafe.start_param;
        }
        if (actParam === 'deposit') {
          setTimeout(function() { openClientDepositModal(); }, 350);
        } else if (actParam === 'withdraw') {
          setTimeout(function() { openClientWithdrawModal(); }, 350);
        }
      } catch(e) {}
`;

if (!html.includes('actParam === \'deposit\'')) {
  html = html.replace("updateStakeProfile();\n    } else {", "updateStakeProfile();" + deepLinkCode + "\n    } else {");
  console.log('[✓] Added deep-linking handler in initTelegram()');
}

fs.writeFileSync(indexPath, html, 'utf8');
console.log('--- ALL COMPREHENSIVE FIXES APPLIED SUCCESSFULLY! ---');
