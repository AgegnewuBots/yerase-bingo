const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

console.log('Original length before Phase 2:', html.length);

// 1. Winner celebration countdown: 7s -> 5s
html = html.replace("fill.style.transition='width 7s linear';", "fill.style.transition='width 5s linear';");
html = html.replace("var nc=7;", "var nc=5;");

// 2. Add Game History handlers and update modal open/close functions
const jsEnhancements = `
// ============================================================================
// GAME HISTORY SHEET & MODAL NAVIGATION HELPERS
// ============================================================================
function openGameHistorySheet() {
  if (soundOn) sfx.playClick();
  var sheet = document.getElementById('game-history-sheet');
  var bd = document.getElementById('game-history-backdrop');
  var nav = document.getElementById('bottom-nav');
  if (nav) nav.style.setProperty('display', 'none', 'important');
  if (bd) bd.style.display = 'block';
  if (sheet) sheet.classList.add('active');
  loadUserGameHistorySheet();
}

function closeGameHistorySheet() {
  if (soundOn) sfx.playClick();
  var sheet = document.getElementById('game-history-sheet');
  var bd = document.getElementById('game-history-backdrop');
  var nav = document.getElementById('bottom-nav');
  if (sheet) sheet.classList.remove('active');
  if (bd) bd.style.display = 'none';
  if (nav && !document.body.classList.contains('in-room-mode')) {
    nav.style.setProperty('display', 'flex', 'important');
  }
}

async function loadUserGameHistorySheet() {
  var listEl = document.getElementById('game-history-sheet-list');
  var playedEl = document.getElementById('gh-stat-played');
  var wonEl = document.getElementById('gh-stat-won');
  var netEl = document.getElementById('gh-stat-net');
  if (!listEl) return;

  var isAm = (currentRulesLang === 'am');
  var curr = isAm ? ' ብር' : ' ETB';

  listEl.innerHTML = '<div style="text-align:center; padding:25px; color:var(--muted);"><i class="fa-solid fa-spinner fa-spin" style="font-size:24px; color:var(--gold);"></i></div>';

  var history = await fetchGameHistory();
  var stats = await fetchProfileStats();

  if (stats) {
    if (playedEl) playedEl.textContent = stats.games_played || 0;
    if (wonEl) wonEl.textContent = stats.games_won || 0;
    if (netEl) netEl.textContent = (stats.total_won || 0) + curr;
  }

  if (!history || !history.length) {
    listEl.innerHTML = '<div style="text-align:center; padding:36px 12px; color:var(--muted); font-size:13px;">' +
      '<i class="fa-solid fa-clock-rotate-left" style="font-size:32px; color:rgba(230,199,135,0.4); margin-bottom:12px; display:block;"></i>' +
      '<span>' + (isAm ? 'ምንም የተጫወቱት ጨዋታ የለም። 10 ወይም 20 ብር ክፍል በመግባት ይጫወቱ!' : 'No games played yet. Join a 10 or 20 Birr room to play!') + '</span>' +
    '</div>';
    return;
  }

  listEl.innerHTML = history.map(function(h) {
    var rawStatus = h.status || 'Completed';
    var isWin = (rawStatus === 'Win') || (h.result && h.result.indexOf('+') !== -1);
    var isPlaying = (rawStatus === 'Playing');
    
    var badgeClass = isWin ? 'gh-badge-win' : (isPlaying ? 'gh-badge-playing' : 'gh-badge-failed');
    var badgeIcon = isWin ? '<i class="fa-solid fa-trophy"></i>' : (isPlaying ? '<i class="fa-solid fa-spinner fa-spin"></i>' : '<i class="fa-solid fa-xmark"></i>');
    var badgeText = isWin ? (isAm ? 'አሸናፊ' : 'Win') : (isPlaying ? (isAm ? 'በመጫወት ላይ' : 'Playing') : (isAm ? 'ተሸናፊ' : 'Failed'));
    
    var stakeText = (h.cards_count || 1) + ' ' + (isAm ? 'ካርቴላ' : 'Cards') + ' • ' + (h.stake || 10) + curr;
    var resultText = h.result && h.result !== '-' ? h.result : (isWin ? ('+' + (h.stake * 8) + curr) : ('-' + (h.entry || h.stake || 10) + curr));
    var timeStr = h.time ? new Date(h.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

    return '<div class="gh-card-item">' +
      '<div style="text-align:left;">' +
        '<div style="font-size:13px; font-weight:800; color:#FFF4D9; display:flex; align-items:center; gap:6px;">' +
          '<span>#' + (h.game_id || 'GAME') + '</span>' +
          '<span style="font-size:10px; color:var(--muted); font-weight:600;">' + timeStr + '</span>' +
        '</div>' +
        '<div style="font-size:11px; color:var(--muted); margin-top:2px;">' + stakeText + '</div>' +
      '</div>' +
      '<div style="text-align:right; display:flex; flex-direction:column; align-items:flex-end; gap:4px;">' +
        '<span class="' + badgeClass + '">' + badgeIcon + ' ' + badgeText + '</span>' +
        '<span style="font-size:12px; font-weight:800; color:' + (isWin ? 'var(--green)' : 'var(--muted)') + ';">' + resultText + '</span>' +
      '</div>' +
    '</div>';
  }).join('');
}
`;

// Insert helpers before translateApp
html = html.replace('function translateApp(lang) {', jsEnhancements + '\nfunction translateApp(lang) {');

// 3. Update openRules, closeRules, openClientDepositModal, closeClientDepositModal, etc.
const oldOpenRules = `function openRules() { 
  if (soundOn) sfx.playClick(); 
  var sheet = document.getElementById('rules-screen');
  var bd = document.getElementById('rules-backdrop');
  if (bd) bd.style.display = 'block';
  if (sheet) sheet.classList.add('active'); 
  renderRules(); 
}
function closeRules() { 
  if (soundOn) sfx.playClick(); 
  var sheet = document.getElementById('rules-screen');
  var bd = document.getElementById('rules-backdrop');
  if (sheet) sheet.classList.remove('active'); 
  if (bd) bd.style.display = 'none';
}`;

const newOpenRules = `function openRules() { 
  if (soundOn) sfx.playClick(); 
  var nav = document.getElementById('bottom-nav');
  if (nav) nav.style.setProperty('display', 'none', 'important');
  var sheet = document.getElementById('rules-screen');
  var bd = document.getElementById('rules-backdrop');
  if (bd) bd.style.display = 'block';
  if (sheet) sheet.classList.add('active'); 
  renderRules(); 
}
function closeRules() { 
  if (soundOn) sfx.playClick(); 
  var sheet = document.getElementById('rules-screen');
  var bd = document.getElementById('rules-backdrop');
  if (sheet) sheet.classList.remove('active'); 
  if (bd) bd.style.display = 'none';
  var nav = document.getElementById('bottom-nav');
  if (nav && !document.body.classList.contains('in-room-mode')) {
    nav.style.setProperty('display', 'flex', 'important');
  }
}`;

html = html.replace(oldOpenRules, newOpenRules);

// 4. Update Deposit and Withdrawal modal open/close to hide/show bottom-nav
const oldDepositModalsOpen = `function openClientDepositModal() {
  if (soundOn) sfx.playClick();
  document.getElementById('dep-req-amount').value = "50";
  document.getElementById('dep-req-ref').value = "";
  document.getElementById('client-deposit-modal').classList.add('active');
}

function closeClientDepositModal() {
  if (soundOn) sfx.playClick();
  document.getElementById('client-deposit-modal').classList.remove('active');
}`;

const newDepositModalsOpen = `function clearDepositErrors() {
  var amtInput = document.getElementById('dep-req-amount');
  var smsInput = document.getElementById('dep-req-sms');
  var amtErr = document.getElementById('dep-amount-error');
  var smsErr = document.getElementById('dep-sms-error');
  if (amtInput) amtInput.style.borderColor = 'rgba(255,255,255,0.15)';
  if (smsInput) smsInput.style.borderColor = 'rgba(255,255,255,0.15)';
  if (amtErr) { amtErr.textContent = ''; amtErr.style.display = 'none'; }
  if (smsErr) { smsErr.textContent = ''; smsErr.style.display = 'none'; }
}

function openClientDepositModal() {
  if (soundOn) sfx.playClick();
  clearDepositErrors();
  var nav = document.getElementById('bottom-nav');
  if (nav) nav.style.setProperty('display', 'none', 'important');
  var amtEl = document.getElementById('dep-req-amount');
  if (amtEl) amtEl.value = "50";
  var smsEl = document.getElementById('dep-req-sms');
  if (smsEl) smsEl.value = "";
  var modal = document.getElementById('client-deposit-modal');
  if (modal) modal.classList.add('active');
}

function closeClientDepositModal() {
  if (soundOn) sfx.playClick();
  clearDepositErrors();
  var modal = document.getElementById('client-deposit-modal');
  if (modal) modal.classList.remove('active');
  var nav = document.getElementById('bottom-nav');
  if (nav && !document.body.classList.contains('in-room-mode')) {
    nav.style.setProperty('display', 'flex', 'important');
  }
}

function openClientWithdrawModal() {
  if (soundOn) sfx.playClick();
  var nav = document.getElementById('bottom-nav');
  if (nav) nav.style.setProperty('display', 'none', 'important');
  var amtEl = document.getElementById('with-req-amount');
  if (amtEl) amtEl.value = "150";
  var phoneEl = document.getElementById('with-req-phone');
  if (phoneEl) phoneEl.value = "";
  updateWageringUI();
  var modal = document.getElementById('client-withdraw-modal');
  if (modal) modal.classList.add('active');
}

function closeClientWithdrawModal() {
  if (soundOn) sfx.playClick();
  var modal = document.getElementById('client-withdraw-modal');
  if (modal) modal.classList.remove('active');
  var nav = document.getElementById('bottom-nav');
  if (nav && !document.body.classList.contains('in-room-mode')) {
    nav.style.setProperty('display', 'flex', 'important');
  }
}`;

html = html.replace(oldDepositModalsOpen, newDepositModalsOpen);

// Also replace the other withdrawal open/close if it exists
html = html.replace(`function openClientWithdrawModal() {
  if (soundOn) sfx.playClick();
  document.getElementById('with-req-amount').value = "150";
  document.getElementById('with-req-phone').value = "";
  updateWageringUI();
  document.getElementById('client-withdraw-modal').classList.add('active');
}

function closeClientWithdrawModal() {
  if (soundOn) sfx.playClick();
  document.getElementById('client-withdraw-modal').classList.remove('active');
}`, '');

// 5. Replace submitClientDeposit implementation with inline validation
const newSubmitClientDeposit = `async function submitClientDeposit() {
  if (soundOn) sfx.playClick();
  clearDepositErrors();
  
  var amtInput = document.getElementById('dep-req-amount');
  var smsInput = document.getElementById('dep-req-sms');
  var amtErr = document.getElementById('dep-amount-error');
  var smsErr = document.getElementById('dep-sms-error');
  
  var amount = parseFloat(amtInput ? amtInput.value : 0);
  var sms = smsInput ? smsInput.value.trim() : '';
  var isAm = (currentRulesLang === 'am');
  
  var hasError = false;
  
  if (isNaN(amount) || amount < 50) {
    hasError = true;
    if (amtInput) amtInput.style.borderColor = '#ef4444';
    if (amtErr) {
      amtErr.textContent = isAm ? 'ዝቅተኛው የማስገቢያ መጠን 50 ብር ነው።' : 'Minimum deposit amount is 50 ETB.';
      amtErr.style.display = 'block';
    }
  }
  
  if (!sms || sms.length < 4) {
    hasError = true;
    if (smsInput) smsInput.style.borderColor = '#ef4444';
    if (smsErr) {
      smsErr.textContent = isAm ? 'የኤስኤምኤስ ማረጋገጫ ወይም የግብይት ቁጥር ማስገባት ግዴታ ነው።' : 'SMS confirmation / Transaction ID is required.';
      smsErr.style.display = 'block';
    }
  }
  
  if (hasError) return;
  
  var method = selectedDepositMethod || 'Telebirr';
  
  try {
    var res = await fetch(API_BASE + '/api/client/deposit', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ user_id: tgUserId, amount: amount, ref_phone: method, sms_text: sms })
    });
    var data = await res.json();
    if (data.success) {
      if (data.new_balance !== undefined) {
        userMainBalance = parseFloat(data.new_balance);
      } else {
        userMainBalance += amount;
      }
      updateBalanceDisplay();
      if (soundOn) sfx.playWin();
      closeClientDepositModal();
      showToast(isAm ? ('የ ' + amount + ' ብር ተቀማጭዎ ገቢ ሆኗል!') : ('Deposit of ' + amount + ' ETB credited successfully!'), true);
      if (typeof Telegram !== 'undefined' && Telegram.WebApp && Telegram.WebApp.showAlert) {
        var depApprovedMsg = isAm 
          ? ('ተቀማጭዎ ጸድቋል! ' + amount + ' ብር ወደ ሂሳብዎ ገቢ ሆኗል።') 
          : ('Deposit Approved! ' + amount + ' ETB has been credited to your wallet.');
        Telegram.WebApp.showAlert(depApprovedMsg);
      }
      loadWallet();
    } else {
      if (amtErr) {
        amtErr.textContent = data.error || (isAm ? 'ተቀማጭ ማድረግ አልተቻለም' : 'Deposit request failed');
        amtErr.style.display = 'block';
      }
    }
  } catch (e) {
    console.error('Deposit error:', e);
    userMainBalance += amount;
    updateBalanceDisplay();
    if (soundOn) sfx.playWin();
    closeClientDepositModal();
    loadWallet();
  }
}`;

// Replace both earlier definitions of submitClientDeposit
html = html.replace(/async function submitClientDeposit\(\)\s*\{[\s\S]*?loadWallet\(\);\s*\}\s*catch[^{]*\{[\s\S]*?closeClientDepositModal\(\);[\s\S]*?\}\s*\}/, newSubmitClientDeposit);
html = html.replace(/async function submitClientDeposit\(\)\s*\{[\s\S]*?fetchTransactions\(\)\.then\(renderTransactions\);[\s\S]*?\}\s*\}/, '');

// 6. Replace pattern cards in getInfoEn and getInfoAm with renderPatternCard helper
const patternRendererFunction = `
function renderPatternCard(activeCells) {
  var letters = ['B', 'I', 'N', 'G', 'O'];
  var h = '<div class="pattern-mini-card">';
  h += '<div class="pmc-head">' + letters.map(function(l){ return '<span class="pmc-h">' + l + '</span>'; }).join('') + '</div>';
  h += '<div class="pmc-grid">';
  for (var i = 0; i < 25; i++) {
    var isCenter = (i === 12);
    var isHit = activeCells.includes(i);
    var cls = isCenter ? 'pmc-cell pmc-center' : (isHit ? 'pmc-cell pmc-hit' : 'pmc-cell');
    var txt = isCenter ? '<i class="fa-solid fa-star" style="font-size:7px;"></i>' : (isHit ? '<i class="fa-solid fa-check" style="font-size:8px;"></i>' : '');
    h += '<span class="' + cls + '">' + txt + '</span>';
  }
  h += '</div></div>';
  return h;
}
`;

html = html.replace('function getInfoEn() {', patternRendererFunction + '\nfunction getInfoEn() {');

// Clean getInfoEn:
const cleanInfoEn = `function getInfoEn() {
  return \`
<div class="rules-support"><i class="fa-solid fa-headset" style="color:var(--gold); margin-right:4px;"></i> <strong>Support</strong><br>If you have any questions, contact <a href="https://t.me/one_day_82" target="_blank">@one_day_82</a></div>
<h2><i class="fa-solid fa-gamepad" style="color:var(--gold); margin-right:6px;"></i> How to Play</h2>
<p><span class="rule-num">1</span> Choose your stake (10 or 20 Birr)</p>
<p><span class="rule-num">2</span> Select up to 2 Bingo cards before countdown ends</p>
<p><span class="rule-num">3</span> Follow called numbers and mark matching squares on your card</p>
<p><span class="rule-num">4</span> Complete any line or 4 corners to claim BINGO</p>
<p style="color:var(--green); margin-top:8px;">With Automatic Daub on, matching numbers are marked for you automatically!</p>
<h2><i class="fa-solid fa-trophy" style="color:var(--gold); margin-right:6px;"></i> Winning Patterns</h2>
<span class="pattern-label">Any row</span>
\${renderPatternCard([0,1,2,3,4])}
<span class="pattern-label">Any column</span>
\${renderPatternCard([0,5,10,15,20])}
<span class="pattern-label">Diagonal 1</span>
\${renderPatternCard([0,6,12,18,24])}
<span class="pattern-label">Diagonal 2</span>
\${renderPatternCard([4,8,12,16,20])}
<span class="pattern-label">Four corners</span>
\${renderPatternCard([0,4,20,24])}
<h2><i class="fa-solid fa-terminal" style="color:var(--gold); margin-right:6px;"></i> Bot Commands</h2>
<div class="rules-cmd"><code>/start</code> <span>Main menu</span></div>
<div class="rules-cmd"><code>/lang</code> <span>Change language</span></div>
<div class="rules-cmd"><code>/play</code> <span>Open Game</span></div>
<div class="rules-cmd"><code>/deposit</code> <span>Deposit funds</span></div>
<div class="rules-cmd"><code>/balance</code> <span>Check balance</span></div>
<div class="rules-cmd"><code>/withdraw</code> <span>Withdraw winnings</span></div>
<div class="rules-cmd"><code>/history</code> <span>Game history</span></div>
<div class="rules-cmd"><code>/profile</code> <span>Player profile</span></div>
<div class="rules-cmd"><code>/support</code> <span>Support representative</span></div>
<div class="rules-cmd"><code>/invite</code> <span>Invite friends</span></div>
<div class="rules-cmd"><code>/info</code> <span>Rules and guide</span></div>
<p style="text-align:center; margin-top:20px; font-size:14px; color:var(--yellow); font-weight:700;">Good luck!</p>
  \`;
}`;

const cleanInfoAm = `function getInfoAm() {
  return \`
<div class="rules-support"><i class="fa-solid fa-headset" style="color:var(--gold); margin-right:4px;"></i> <strong>የደንበኞች ድጋፍ</strong><br>ችግር ካጋጠመዎት <a href="https://t.me/one_day_82" target="_blank">@one_day_82</a> ን ያግኙ</div>
<h2><i class="fa-solid fa-gamepad" style="color:var(--gold); margin-right:6px;"></i> እንዴት እንደሚጫወቱ</h2>
<p><span class="rule-num">1</span> የመደብ ክፍል ይምረጡ (የ10 ወይም 20 ብር)</p>
<p><span class="rule-num">2</span> ቆጣሪው ከማለቁ በፊት እስከ 2 የቢንጎ ካርቴላዎችን ይቁረጡ</p>
<p><span class="rule-num">3</span> ቁጥሮች ሲጠሩ እየተከታተሉ ካርቴላዎ ውስጥ ካሉ ያድምቁ</p>
<p><span class="rule-num">4</span> ማንኛውንም መስመር ወይም 4 ማዕዘን ሲሞሉ "ቢንጎ" ይበሉ</p>
<p style="color:var(--green); margin-top:8px;">አውቶማቲክ ካበሩ 3 እና 4ን ማድረግ አይጠበቅብዎትም፤ በራሱ ያደምቅልዎታል!</p>
<h2><i class="fa-solid fa-trophy" style="color:var(--gold); margin-right:6px;"></i> የማሸነፊያ ንድፎች</h2>
<span class="pattern-label">ማንኛውንም ረድፍ</span>
\${renderPatternCard([0,1,2,3,4])}
<span class="pattern-label">ማንኛውንም አምድ</span>
\${renderPatternCard([0,5,10,15,20])}
<span class="pattern-label">ሰያፍ መስመር 1</span>
\${renderPatternCard([0,6,12,18,24])}
<span class="pattern-label">ሰያፍ መስመር 2</span>
\${renderPatternCard([4,8,12,16,20])}
<span class="pattern-label">አራቱንም ማዕዘናት</span>
\${renderPatternCard([0,4,20,24])}
<h2><i class="fa-solid fa-terminal" style="color:var(--gold); margin-right:6px;"></i> የቦት ትእዛዞች</h2>
<div class="rules-cmd"><code>/start</code> <span>ዋና ማውጫ</span></div>
<div class="rules-cmd"><code>/lang</code> <span>ቋንቋ ይቀይሩ</span></div>
<div class="rules-cmd"><code>/play</code> <span>ይጫወቱ</span></div>
<div class="rules-cmd"><code>/deposit</code> <span>ብር ያስገቡ</span></div>
<div class="rules-cmd"><code>/balance</code> <span>ሒሳብ ያረጋግጡ</span></div>
<div class="rules-cmd"><code>/withdraw</code> <span>ያሸነፉትን ያውጡ</span></div>
<div class="rules-cmd"><code>/history</code> <span>የጨዋታ ታሪክ</span></div>
<div class="rules-cmd"><code>/profile</code> <span>የተጫዋች መገለጫ</span></div>
<div class="rules-cmd"><code>/support</code> <span>የድጋፍ አገልግሎት</span></div>
<div class="rules-cmd"><code>/invite</code> <span>ጓደኛ ይጋብዙ</span></div>
<div class="rules-cmd"><code>/info</code> <span>ደንቦችና መመሪያዎች</span></div>
<p style="text-align:center; margin-top:20px; font-size:14px; color:var(--yellow); font-weight:700;">መልካም ዕድል ይገጥምዎ!</p>
  \`;
}`;

html = html.replace(/function getInfoEn\(\)\s*\{[\s\S]*?return \`[\s\S]*?\`;\s*\}/, cleanInfoEn);
html = html.replace(/function getInfoAm\(\)\s*\{[\s\S]*?return \`[\s\S]*?\`;\s*\}/, cleanInfoAm);

// 7. Enhance showToast to sanitize any emojis and display pure FontAwesome icons
const oldShowToast = `function showToast(message, isSuccess) {
  var toast = document.getElementById('yerase-toast');
  var msgEl = document.getElementById('yerase-toast-msg');
  if (!toast || !msgEl) return;
  msgEl.textContent = message;
  toast.classList.add('show');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(function() {
    toast.classList.remove('show');
  }, 3200);
}`;

const newShowToast = `function showToast(message, isSuccess) {
  var toast = document.getElementById('yerase-toast');
  var msgEl = document.getElementById('yerase-toast-msg');
  var iconEl = document.getElementById('yerase-toast-icon');
  if (!toast || !msgEl) return;

  // Clean out any unicode emojis
  var clean = (message || '').replace(/[\\u{1F300}-\\u{1F9FF}\\u{2600}-\\u{26FF}\\u{2700}-\\u{27BF}\\u{1F1E0}-\\u{1F1FF}\\u{1F600}-\\u{1F64F}\\u{1F680}-\\u{1F6FF}]/gu, '').trim();
  msgEl.textContent = clean;

  if (iconEl) {
    if (isSuccess) {
      iconEl.innerHTML = '<i class="fa-solid fa-circle-check" style="color:var(--green); font-size:14px;"></i>';
    } else {
      iconEl.innerHTML = '<i class="fa-solid fa-circle-info" style="color:var(--gold); font-size:14px;"></i>';
    }
  }

  toast.classList.add('show');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(function() {
    toast.classList.remove('show');
  }, 3200);
}`;

html = html.replace(oldShowToast, newShowToast);

// 8. Update APP_TRANSLATIONS for nav-home, back button, CBE, and Game History
html = html.replace('"lbl-nav-home": "ROOMS",', '"lbl-nav-home": "HOME",\n    "lbl-room-pick-history": "Game History",\n    "lbl-game-history-sheet-title": "Game History",\n    "lbl-gh-played": "PLAYED",\n    "lbl-gh-won": "WINS",\n    "lbl-gh-net": "NET WON",\n    "lbl-gh-empty": "No games played yet. Join a 10 or 20 Birr room to play!",');
html = html.replace('"lbl-nav-home": "ክፍሎች",', '"lbl-nav-home": "መነሻ",\n    "lbl-room-pick-history": "የጨዋታ ታሪክ",\n    "lbl-game-history-sheet-title": "የጨዋታ ታሪክ",\n    "lbl-gh-played": "የተጫወቱት",\n    "lbl-gh-won": "ያሸነፉት",\n    "lbl-gh-net": "ጠቅላላ ትርፍ",\n    "lbl-gh-empty": "ምንም የተጫወቱት ጨዋታ የለም። 10 ወይም 20 ብር ክፍል በመግባት ይጫወቱ!",');

html = html.replace('"lbl-room-back-btn": "Rooms",', '"lbl-room-back-btn": "Home",');
html = html.replace('"lbl-room-back-btn": "ክፍሎች",', '"lbl-room-back-btn": "መነሻ",');

html = html.replace('"lbl-dep-method-cbe": "CBE Birr",', '"lbl-dep-method-cbe": "CBE",');
html = html.replace('"lbl-dep-method-cbe": "ንግድ ባንክ",', '"lbl-dep-method-cbe": "ሲቢኢ",');

// 9. Remove all remaining emojis across HTML and code
html = html.replace(/👑\s*/g, '');
html = html.replace(/<span class="wn-crown">👑<\/span>/g, '<span class="wn-crown"><i class="fa-solid fa-crown" style="color:#FCD34D;"></i></span>');
html = html.replace(/🎉\s*/g, '');
html = html.replace(/💡\s*/g, '<i class="fa-solid fa-circle-info" style="color:var(--gold); margin-right:4px;"></i>');
html = html.replace(/☎️\s*/g, '<i class="fa-solid fa-headset" style="color:var(--gold); margin-right:4px;"></i>');
html = html.replace(/⚖️\s*/g, '<i class="fa-solid fa-scale-balanced" style="color:var(--gold); margin-right:4px;"></i>');
html = html.replace(/🎮\s*/g, '<i class="fa-solid fa-gamepad" style="color:var(--gold); margin-right:4px;"></i>');
html = html.replace(/💰\s*/g, '<i class="fa-solid fa-coins" style="color:var(--gold); margin-right:4px;"></i>');
html = html.replace(/🍀\s*/g, '');
html = html.replace(/⚠️\s*/g, '');
html = html.replace(/✅\s*/g, '');
html = html.replace(/🔔\s*/g, '');
html = html.replace(/🇪🇹\s*/g, '');
html = html.replace(/👉\s*/g, '');
html = html.replace(/<div class="onboarding-visual-trophy">🏆<\/div>/g, '<div class="onboarding-visual-trophy"><i class="fa-solid fa-trophy" style="font-size:48px; color:var(--gold);"></i></div>');

// Replace medals in leaderboard:
html = html.replace("var medal = i === 0 ? '👑 ' : i === 1 ? '🥈 ' : i === 2 ? '🥉 ' : '';", 
  "var medal = i === 0 ? '<i class=\"fa-solid fa-crown\" style=\"color:#FCD34D; margin-right:4px;\"></i>' : i === 1 ? '<i class=\"fa-solid fa-medal\" style=\"color:#CBD5E1; margin-right:4px;\"></i>' : i === 2 ? '<i class=\"fa-solid fa-medal\" style=\"color:#D97706; margin-right:4px;\"></i>' : '';");

fs.writeFileSync(indexPath, html, 'utf8');
console.log('Phase 2 applied successfully! New length:', html.length);
