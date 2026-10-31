const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

console.log('Original length:', html.length);

// 1. App width & responsive styling to remove all side spaces in Telegram
const oldAppStyle = `.app{max-width:390px;margin:0 auto;min-height:100vh;display:flex;flex-direction:column;padding-bottom:60px;}`;
const newAppStyle = `.app {
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding-bottom: 60px;
}
@media (max-width: 600px) {
  .app {
    max-width: 100% !important;
    width: 100% !important;
    margin: 0 !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
  }
}`;

if (html.includes(oldAppStyle)) {
  html = html.replace(oldAppStyle, newAppStyle);
  console.log('[✓] Updated .app responsive layout');
} else {
  console.warn('[!] oldAppStyle not found, searching alternative...');
  html = html.replace(/\.app\s*\{[^}]+\}/, newAppStyle);
  console.log('[✓] Replaced .app style via regex');
}

// 2. Rules bottom sheet height & Game History sheet styles
const oldRulesSheet = `.rules-bottom-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-width: 540px;
  margin: 0 auto;
  background: rgba(14, 19, 32, 0.98);
  border-top: 1.5px solid rgba(230, 199, 135, 0.25);
  border-radius: 24px 24px 0 0;
  box-shadow: 0 -10px 40px rgba(0,0,0,0.8), 0 0 30px rgba(230, 199, 135, 0.1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  z-index: 1000;
  transform: translateY(105%);
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
}`;

const newRulesAndHistoryStyles = `.rules-bottom-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-width: 540px;
  height: 85vh;
  max-height: 85vh;
  margin: 0 auto;
  background: rgba(14, 19, 32, 0.98);
  border-top: 1.5px solid rgba(230, 199, 135, 0.25);
  border-radius: 24px 24px 0 0;
  box-shadow: 0 -10px 40px rgba(0,0,0,0.8), 0 0 30px rgba(230, 199, 135, 0.1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  z-index: 1000;
  transform: translateY(105%);
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Modern Game History Bottom Sheet */
.game-history-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-width: 540px;
  height: 82vh;
  max-height: 82vh;
  margin: 0 auto;
  background: rgba(14, 19, 32, 0.98);
  border-top: 1.5px solid rgba(230, 199, 135, 0.25);
  border-radius: 24px 24px 0 0;
  box-shadow: 0 -10px 40px rgba(0,0,0,0.8), 0 0 30px rgba(230, 199, 135, 0.1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  z-index: 1000;
  transform: translateY(105%);
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.game-history-sheet.active {
  transform: translateY(0);
}
.gh-stat-chip {
  flex: 1;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 10px 8px;
  text-align: center;
}
.gh-card-item {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  transition: background 0.15s ease;
}
.gh-badge-win {
  background: rgba(16, 185, 129, 0.18);
  border: 1px solid rgba(16, 185, 129, 0.4);
  color: #10B981;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.gh-badge-failed {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.35);
  color: #EF4444;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.gh-badge-playing {
  background: rgba(245, 158, 11, 0.18);
  border: 1px solid rgba(245, 158, 11, 0.4);
  color: #F59E0B;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* Pattern Mini Cards without Emojis */
.pattern-mini-card {
  width: 140px;
  background: rgba(18, 10, 32, 0.95);
  border: 1px solid rgba(230, 199, 135, 0.3);
  border-radius: 8px;
  padding: 6px;
  margin: 6px 0 14px;
}
.pmc-head {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 2px;
  margin-bottom: 4px;
  text-align: center;
}
.pmc-h {
  font-size: 9px;
  font-weight: 900;
  color: var(--gold);
}
.pmc-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 3px;
}
.pmc-cell {
  width: 22px;
  height: 22px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 8px;
  color: #fff;
}
.pmc-cell.pmc-hit {
  background: var(--green);
  border-color: #34d399;
  color: #000;
  box-shadow: 0 0 6px rgba(16, 185, 129, 0.6);
}
.pmc-cell.pmc-center {
  background: rgba(230, 199, 135, 0.2);
  border-color: var(--gold);
  color: var(--gold);
}`;

if (html.includes(oldRulesSheet)) {
  html = html.replace(oldRulesSheet, newRulesAndHistoryStyles);
  console.log('[✓] Added rules height and Game History sheet styles');
} else {
  console.warn('[!] oldRulesSheet not exact match, appending to stylesheet');
  html = html.replace('</style>', newRulesAndHistoryStyles + '\n</style>');
}

// 3. Replace Toast emoji icon with FontAwesome bell
html = html.replace('<div id="yerase-toast"><span>⭐</span><span id="yerase-toast-msg">Notification</span></div>',
  '<div id="yerase-toast"><span id="yerase-toast-icon"><i class="fa-solid fa-bell" style="color:var(--gold);"></i></span><span id="yerase-toast-msg">Notification</span></div>');

// 4. Update Official Logo in Center Branding
const oldCenterLogo = `<img id="stake-center-logo-img" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23FFF4D9'/%3E%3Cstop offset='50%25' stop-color='%23E6C787'/%3E%3Cstop offset='100%25' stop-color='%23B8860B'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='50' cy='50' r='46' fill='url(%23g)' stroke='%23E6C787' stroke-width='2.5'/%3E%3Ccircle cx='50' cy='50' r='38' fill='%23120824'/%3E%3Ctext x='50' y='63' font-size='42' font-family='sans-serif' font-weight='900' fill='%23FFF4D9' text-anchor='middle'%3E%E1%8B%A8%3C/text%3E%3C/svg%3E" class="stake-emblem-img" style="width:88px; height:88px; border-radius:50%; border:2px solid rgba(255,255,255,0.3); box-shadow:0 8px 30px rgba(0,0,0,0.6); position:relative; z-index:1;" alt="Yerase Bingo">`;
const newCenterLogo = `<img id="stake-center-logo-img" src="assets/logo.jpg" onerror="this.src='https://i.ibb.co/twZTnFpw/7e495c40-d1e9-4583-9ecf-49b4c4f9d925.jpg'" class="stake-emblem-img" style="width:90px; height:90px; border-radius:50%; object-fit:cover; border:2.5px solid var(--gold); box-shadow:0 0 25px rgba(230,199,135,0.45); position:relative; z-index:1;" alt="Yerase Bingo">`;

if (html.includes(oldCenterLogo)) {
  html = html.replace(oldCenterLogo, newCenterLogo);
  console.log('[✓] Replaced center emblem with Official Logo');
}

// Also replace in Create Password screen if present
html = html.replace(/<img src="data:image\/svg\+xml,[^"]+"([^>]+alt="Yerase Bingo Logo"[^>]*>)/,
  '<img src="assets/logo.jpg" onerror="this.src=\'https://i.ibb.co/twZTnFpw/7e495c40-d1e9-4583-9ecf-49b4c4f9d925.jpg\'"$1');

// 5. Add Game History button in Home screen (#screen-stake)
const oldStakeBox = `<div class="stake-box" style="display:flex; flex-direction:column; gap:14px; width:100%; max-width:390px; margin:22px auto 20px; padding:0 4px;">
        <button class="room-pick-btn" onclick="selectStake(10)">
          <span id="lbl-room-pick-10">Play 10 Birr</span>
          <i class="fa-solid fa-arrow-right"></i>
        </button>
        <button class="room-pick-btn" onclick="selectStake(20)">
          <span id="lbl-room-pick-20">Play 20 Birr</span>
          <i class="fa-solid fa-arrow-right"></i>
        </button>
      </div>`;

const newStakeBox = `<div class="stake-box" style="display:flex; flex-direction:column; gap:14px; width:100%; max-width:440px; margin:20px auto; padding:0 4px;">
        <button class="room-pick-btn" onclick="selectStake(10)">
          <span id="lbl-room-pick-10">Play 10 Birr</span>
          <i class="fa-solid fa-arrow-right"></i>
        </button>
        <button class="room-pick-btn" onclick="selectStake(20)">
          <span id="lbl-room-pick-20">Play 20 Birr</span>
          <i class="fa-solid fa-arrow-right"></i>
        </button>
        <button class="room-pick-btn" onclick="openGameHistorySheet()" style="background:linear-gradient(135deg, rgba(35, 18, 58, 0.96) 0%, rgba(20, 10, 36, 0.98) 100%); border-color:rgba(230, 199, 135, 0.35);">
          <div style="display:flex; align-items:center; gap:12px;">
            <i class="fa-solid fa-clock-rotate-left" style="color:#E6C787; font-size:18px;"></i>
            <span id="lbl-room-pick-history">Game History</span>
          </div>
          <i class="fa-solid fa-arrow-right"></i>
        </button>
      </div>`;

if (html.includes(oldStakeBox)) {
  html = html.replace(oldStakeBox, newStakeBox);
  console.log('[✓] Added Game History button to Home screen');
} else {
  console.warn('[!] oldStakeBox not exact match');
}

// 6. Insert Game History Sheet HTML right after rules-screen
const historySheetHtml = `
  <!-- Game History Bottom Sheet Backdrop & Container -->
  <div id="game-history-backdrop" onclick="closeGameHistorySheet()" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.68); backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px); z-index:999; transition:opacity 0.25s ease;"></div>
  <div class="game-history-sheet" id="game-history-sheet">
    <div class="bottom-sheet-handle-bar"><div class="bottom-sheet-handle"></div></div>
    <div class="rules-header">
      <button class="rules-back" onclick="closeGameHistorySheet()"><i class="fa-solid fa-arrow-left"></i></button>
      <div class="rules-header-title" id="lbl-game-history-sheet-title">Game History</div>
      <button onclick="loadUserGameHistorySheet()" style="background:none; border:none; color:var(--gold); font-size:14px; cursor:pointer; padding:6px;" title="Refresh"><i class="fa-solid fa-rotate-right"></i></button>
    </div>
    
    <!-- Mini Stats Bar in Sheet -->
    <div style="display:flex; gap:8px; padding:10px 16px; background:rgba(0,0,0,0.25); border-bottom:1px solid rgba(255,255,255,0.06);">
      <div class="gh-stat-chip">
        <div style="font-size:10px; color:var(--muted); font-weight:700;" id="lbl-gh-played">PLAYED</div>
        <div id="gh-stat-played" style="font-size:15px; font-weight:900; color:#fff;">0</div>
      </div>
      <div class="gh-stat-chip">
        <div style="font-size:10px; color:var(--green); font-weight:700;" id="lbl-gh-won">WINS</div>
        <div id="gh-stat-won" style="font-size:15px; font-weight:900; color:var(--green);">0</div>
      </div>
      <div class="gh-stat-chip">
        <div style="font-size:10px; color:var(--gold); font-weight:700;" id="lbl-gh-net">NET WON</div>
        <div id="gh-stat-net" style="font-size:15px; font-weight:900; color:var(--gold);">0 Br</div>
      </div>
    </div>

    <!-- History list container -->
    <div id="game-history-sheet-list" style="flex:1; overflow-y:auto; padding:14px 16px 30px; display:flex; flex-direction:column; gap:10px; -webkit-overflow-scrolling:touch;">
      <div style="text-align:center; padding:30px 10px; color:var(--muted); font-size:13px;" id="lbl-gh-empty">
        <i class="fa-solid fa-clock-rotate-left" style="font-size:32px; color:rgba(230,199,135,0.4); margin-bottom:10px; display:block;"></i>
        <span>No games played yet. Join a 10 or 20 Birr room to play!</span>
      </div>
    </div>
  </div>
`;

if (!html.includes('id="game-history-sheet"')) {
  html = html.replace('</div>\n  </div>\n\n  <div class="screen" id="screen-home">', '</div>\n  </div>' + historySheetHtml + '\n  <div class="screen" id="screen-home">');
  console.log('[✓] Inserted Game History Sheet HTML');
}

// 7. Remove static broken game history table from Profile screen
const oldProfileHistoryTable = `<div class="section-title"  id="lbl-prof-hist-title">Game History</div>
      <div class="table-box"><div class="table-head" id="lbl-prof-hist-head"><span>GAME</span><span>ENTRY</span><span>STATUS</span><span>RESULT</span></div><div id="p-history-rows"><div class="empty-row">No games yet</div></div></div>`;

if (html.includes(oldProfileHistoryTable)) {
  html = html.replace(oldProfileHistoryTable, '');
  console.log('[✓] Removed static Game History table from Profile screen');
} else {
  // Regex cleanup for profile table
  html = html.replace(/<div class="section-title"[^>]*id="lbl-prof-hist-title"[^>]*>[\s\S]*?<div id="p-history-rows">[\s\S]*?<\/div><\/div>/, '');
  console.log('[✓] Cleaned up profile history table via regex');
}

// 8. Bottom Nav Tab rename: ROOMS -> HOME
html = html.replace('<span class="nav-text" id="lbl-nav-home">ROOMS</span>', '<span class="nav-text" id="lbl-nav-home">HOME</span>');

// 9. In Room Back button: Rooms -> Home
html = html.replace('<span id="lbl-room-back-btn">Rooms</span>', '<span id="lbl-room-back-btn">Home</span>');
html = html.replace('<span id="lbl-spec-banner-btn">LOBBY</span>', '<span id="lbl-spec-banner-btn">Home</span>');

// 10. Deposit Modal:
// a. Change "CBE Birr" to "CBE"
html = html.replace('<span id="lbl-dep-method-cbe">CBE Birr</span>', '<span id="lbl-dep-method-cbe">CBE</span>');
html = html.replace("selectDepositMethod('CBE Birr')", "selectDepositMethod('CBE')");

// b. Remove transfer phone input and add inline error messages
const oldDepositFields = `        <div class="input-group" style="margin-bottom:12px;">
          <label id="lbl-dep-amount-label">DEPOSIT AMOUNT - Min 50 Br</label>
          <div class="input-wrap">
            <input type="number" id="dep-req-amount" class="auth-input" placeholder="50" min="50" value="50" onkeydown="if(event.key === 'Enter') submitClientDeposit()">
          </div>
        </div>
        
        <div class="input-group" style="margin-bottom:12px;">
          <label id="lbl-dep-phone-label">TRANSFER PHONE / SENDER</label>
          <div class="input-wrap">
            <input type="text" id="dep-req-ref" class="auth-input" placeholder="09xxxxxxxx" onkeydown="if(event.key === 'Enter') submitClientDeposit()">
          </div>
        </div>

        <div class="input-group" style="margin-bottom:16px;">
          <label id="lbl-dep-sms-label">SMS CONFIRMATION / TXN ID</label>
          <div class="input-wrap">
            <textarea id="dep-req-sms" class="auth-input" rows="2" style="resize:none; padding:10px 14px; font-size:12px; height:auto; min-height:54px;" placeholder="Paste bank or Telebirr SMS confirmation here..."></textarea>
          </div>
        </div>`;

const newDepositFields = `        <div class="input-group" style="margin-bottom:14px;">
          <label id="lbl-dep-amount-label">DEPOSIT AMOUNT - Min 50 Br</label>
          <div class="input-wrap">
            <input type="number" id="dep-req-amount" class="auth-input" placeholder="50" min="50" value="50" oninput="clearDepositErrors()" onkeydown="if(event.key === 'Enter') submitClientDeposit()">
          </div>
          <div id="dep-amount-error" style="display:none; color:#ef4444; font-size:11px; font-weight:700; margin-top:5px; text-align:left;"></div>
        </div>

        <div class="input-group" style="margin-bottom:16px;">
          <label id="lbl-dep-sms-label">SMS CONFIRMATION / TXN ID</label>
          <div class="input-wrap">
            <textarea id="dep-req-sms" class="auth-input" rows="2" style="resize:none; padding:10px 14px; font-size:12px; height:auto; min-height:54px;" placeholder="Paste bank or Telebirr SMS confirmation here..." oninput="clearDepositErrors()"></textarea>
          </div>
          <div id="dep-sms-error" style="display:none; color:#ef4444; font-size:11px; font-weight:700; margin-top:5px; text-align:left;"></div>
        </div>`;

if (html.includes(oldDepositFields)) {
  html = html.replace(oldDepositFields, newDepositFields);
  console.log('[✓] Removed transfer phone field and added inline validation errors');
} else {
  console.warn('[!] oldDepositFields not exact match');
}

// 11. Winner countdown initial text: 10 -> 5
html = html.replace('<div class="next-count" id="next-count">10</div>', '<div class="next-count" id="next-count">5</div>');

fs.writeFileSync(indexPath, html, 'utf8');
console.log('Phase 1 applied successfully. New length:', html.length);
