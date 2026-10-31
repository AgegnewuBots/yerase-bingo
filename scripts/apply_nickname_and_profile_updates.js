const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

console.log('Original length before nickname updates:', html.length);

// 1. Top Bar user info layout
const oldTopBarUserInfo = `<div class="home-user-info">
          <div class="home-user-name-row">
            <span id="home-user-name" class="home-user-name" style="color:#FFFFFF; font-weight:800;">Player</span>
            
          </div>
          <div class="home-user-id-row" style="color:rgba(255,255,255,0.65); font-size:10.5px; font-weight:600; margin-top:2px; display:flex; align-items:center; gap:4px;">
            <span>ID: <strong id="home-user-id-val" style="color:#FFFFFF;"></strong></span>
            <button class="home-copy-id-btn" onclick="event.stopPropagation(); copyUserId();" style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); color:#E6C787; border-radius:4px; padding:1px 5px; font-size:9.5px; cursor:pointer;" title="Copy ID">
              <i class="fa-solid fa-copy" style="color:#E6C787;"></i>
            </button>
          </div>
        </div>`;

const newTopBarUserInfo = `<div class="home-user-info">
          <div class="home-user-name-row" style="display:flex; align-items:center; gap:6px; max-width:140px;">
            <span id="home-user-name" class="home-user-name" style="color:#FFFFFF; font-weight:800; font-size:12.5px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">Player</span>
            <span id="home-user-tag" style="color:var(--gold); font-size:9.5px; font-weight:700; background:rgba(230,199,135,0.12); padding:1px 5px; border-radius:5px; border:1px solid rgba(230,199,135,0.25); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:65px;">@user</span>
          </div>
          <div class="home-user-id-row" style="color:rgba(255,255,255,0.65); font-size:10px; font-weight:600; margin-top:2px; display:flex; align-items:center; gap:4px;">
            <span>ID: <strong id="home-user-id-val" style="color:#FFFFFF;">3050692752</strong></span>
            <button class="home-copy-id-btn" onclick="event.stopPropagation(); copyUserId();" style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); color:#E6C787; border-radius:4px; padding:1px 5px; font-size:9.5px; cursor:pointer;" title="Copy ID">
              <i class="fa-solid fa-copy" style="color:#E6C787;"></i>
            </button>
          </div>
        </div>`;

if (html.includes(oldTopBarUserInfo)) {
  html = html.replace(oldTopBarUserInfo, newTopBarUserInfo);
  console.log('[✓] Updated Topbar user info with Nickname, Username tag, and ID');
} else {
  console.warn('[!] oldTopBarUserInfo not exact match, searching alternative...');
  html = html.replace(/<div class="home-user-info">[\s\S]*?<div class="home-user-id-row">[\s\S]*?<\/div>\s*<\/div>/, newTopBarUserInfo);
  console.log('[✓] Replaced Topbar user info via regex');
}

// 2. Profile Screen header with Nickname, Edit Nickname button, @username, and ID
const oldProfileHeader = `<div class="profile-header">
        <div class="profile-avatar" id="p-avatar">
          <img id="p-avatar-img" src="" style="display:none;">
          <span class="avatar-letter" id="p-avatar-letter">?</span>
        </div>
        <div>
          <div class="profile-name" id="p-name">—</div>
          <div style="display:flex; align-items:center; gap:8px; margin-top:2px;">
            <div class="profile-id" id="p-id" style="margin:0;">ID: —</div>
            <button onclick="copyUserId()" style="background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15); border-radius:6px; padding:3px 6px; color:var(--text); font-size:10px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:4px; transition:all 0.2s;"><i class="fa-regular fa-copy"></i> Copy</button>
          </div>
          <div class="profile-username" id="p-username" style="display:none;"></div>
          <div class="profile-bal" id="p-bal"><i class="fa-solid fa-wallet" style="color:#E6C787; margin-right:4px;"></i> — Br</div>
        </div>
      </div>`;

const newProfileHeader = `<div class="profile-header">
        <div class="profile-avatar" id="p-avatar">
          <img id="p-avatar-img" src="" style="display:none;">
          <span class="avatar-letter" id="p-avatar-letter">?</span>
        </div>
        <div style="flex:1; min-width:0;">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:6px;">
            <div style="display:flex; align-items:center; gap:6px; min-width:0;">
              <span class="profile-name" id="p-name" style="font-size:16px; font-weight:900; color:#fff; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">Player</span>
              <span id="p-nickname-badge" style="background:rgba(124,58,237,0.25); border:1px solid rgba(167,139,250,0.4); color:var(--purple-light); font-size:9.5px; font-weight:800; padding:1px 6px; border-radius:5px;">NICKNAME</span>
            </div>
            <button onclick="editNicknamePrompt()" style="background:rgba(230,199,135,0.12); border:1px solid rgba(230,199,135,0.3); color:var(--gold); border-radius:8px; padding:4px 8px; font-size:10px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:4px; flex-shrink:0;">
              <i class="fa-solid fa-pen-to-square"></i> <span id="lbl-edit-nickname">Edit Nickname</span>
            </button>
          </div>
          <div class="profile-username" id="p-username" style="display:flex; align-items:center; gap:5px; color:var(--gold); font-size:12px; font-weight:700; margin-top:3px;">
            <i class="fa-solid fa-at" style="font-size:10px;"></i>
            <span id="p-username-val">player</span>
          </div>
          <div style="display:flex; align-items:center; gap:8px; margin-top:3px;">
            <div class="profile-id" id="p-id" style="margin:0; font-size:11px; color:rgba(255,255,255,0.7);">ID: <strong id="p-id-val" style="color:#fff;">—</strong></div>
            <button onclick="copyUserId()" style="background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15); border-radius:6px; padding:2px 6px; color:var(--text); font-size:10px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:4px; transition:all 0.2s;"><i class="fa-regular fa-copy"></i> Copy</button>
          </div>
          <div class="profile-bal" id="p-bal" style="margin-top:6px;"><i class="fa-solid fa-wallet" style="color:#E6C787; margin-right:4px;"></i> — Br</div>
        </div>
      </div>`;

if (html.includes(oldProfileHeader)) {
  html = html.replace(oldProfileHeader, newProfileHeader);
  console.log('[✓] Updated Profile Screen header with Nickname, Username, ID, and Edit button');
} else {
  console.warn('[!] oldProfileHeader not exact match, searching alternative...');
  html = html.replace(/<div class="profile-header">[\s\S]*?id="p-bal"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/, newProfileHeader);
  console.log('[✓] Replaced Profile header via regex');
}

// 3. Wallet Screen header
const oldWalletHeader = `<div class="profile-header" style="margin-bottom:12px;">
        <div class="profile-avatar" id="wl-avatar">
          <img id="wl-avatar-img" src="" style="display:none;">
          <span class="avatar-letter" id="wl-avatar-letter">?</span>
        </div>
        <div>
          <div class="profile-name" id="wl-name">—</div>
          <div class="profile-id" id="wl-id">ID: —</div>
          <div class="profile-username" id="wl-username" style="display:none;"></div>
          <div class="profile-bal" id="wl-bal"><i class="fa-solid fa-wallet" style="color:#E6C787; margin-right:4px;"></i> — Br</div>
        </div>
      </div>`;

const newWalletHeader = `<div class="profile-header" style="margin-bottom:12px;">
        <div class="profile-avatar" id="wl-avatar">
          <img id="wl-avatar-img" src="" style="display:none;">
          <span class="avatar-letter" id="wl-avatar-letter">?</span>
        </div>
        <div style="flex:1; min-width:0;">
          <div class="profile-name" id="wl-name" style="font-size:16px; font-weight:900; color:#fff;">—</div>
          <div class="profile-username" id="wl-username" style="display:flex; align-items:center; gap:5px; color:var(--gold); font-size:12px; font-weight:700; margin-top:2px;">
            <i class="fa-solid fa-at" style="font-size:10px;"></i>
            <span id="wl-username-val">—</span>
          </div>
          <div class="profile-id" id="wl-id" style="font-size:11px; color:rgba(255,255,255,0.7); margin-top:2px;">ID: —</div>
          <div class="profile-bal" id="wl-bal" style="margin-top:4px;"><i class="fa-solid fa-wallet" style="color:#E6C787; margin-right:4px;"></i> — Br</div>
        </div>
      </div>`;

if (html.includes(oldWalletHeader)) {
  html = html.replace(oldWalletHeader, newWalletHeader);
  console.log('[✓] Updated Wallet Screen header with Nickname, Username, and ID');
}

// 4. Update getUserDisplayName, getUserHandle, updateUserInfo, and add editNicknamePrompt
const oldGetDisplayName = `function getUserDisplayName() {
  if (tgUser && tgUser.first_name) {
    var full = tgUser.first_name + (tgUser.last_name ? ' ' + tgUser.last_name : '');
    if (full.trim()) return full.trim();
  }
  var savedName = localStorage.getItem('bingio_user_name');
  if (savedName && savedName !== 'Web Player') return savedName;
  var uid = formatUserId(tgUserId);
  return 'Player ' + uid;
}`;

const newGetDisplayNameAndHandle = `function getUserDisplayName() {
  var savedNick = localStorage.getItem('bingio_user_nickname');
  if (savedNick && savedNick.trim() && savedNick.trim() !== 'Web Player' && !savedNick.startsWith('Player 3050')) {
    return savedNick.trim();
  }
  if (tgUser && tgUser.first_name) {
    var full = tgUser.first_name + (tgUser.last_name ? ' ' + tgUser.last_name : '');
    if (full.trim()) return full.trim();
  }
  var savedName = localStorage.getItem('bingio_user_name');
  if (savedName && savedName !== 'Web Player') return savedName;
  var uid = formatUserId(tgUserId);
  return 'Player ' + uid.slice(-4);
}

function getUserHandle() {
  if (tgUser && tgUser.username) {
    var u = tgUser.username.trim();
    return u.startsWith('@') ? u : '@' + u;
  }
  var savedUsername = localStorage.getItem('bingio_user_username');
  if (savedUsername && savedUsername.trim()) {
    var s = savedUsername.trim();
    return s.startsWith('@') ? s : '@' + s;
  }
  return '@player_' + formatUserId(tgUserId).slice(-4);
}

async function editNicknamePrompt() {
  if (soundOn) sfx.playClick();
  var isAm = (currentRulesLang === 'am');
  var currentNick = getUserDisplayName();
  var newNick = prompt(isAm ? 'አዲሱን የመጠሪያ ስምዎን ያስገቡ:' : 'Enter your new in-game nickname:', currentNick);
  if (newNick && newNick.trim() && newNick.trim() !== currentNick) {
    var cleaned = newNick.trim().slice(0, 20);
    localStorage.setItem('bingio_user_nickname', cleaned);
    localStorage.setItem('bingio_user_name', cleaned);
    if (tgUser) tgUser.first_name = cleaned;
    
    try {
      await fetch(API_BASE + '/api/update_name', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          user_id: tgUserId,
          first_name: cleaned,
          username: getUserHandle()
        })
      });
    } catch (e) {}

    updateUserInfo();
    showToast(isAm ? 'መጠሪያ ስምዎ በተሳካ ሁኔታ ተቀይሯል!' : 'Nickname updated successfully!', true);
  }
}`;

html = html.replace(oldGetDisplayName, newGetDisplayNameAndHandle);

// 5. Update updateUserInfo function
const oldUpdateUserInfo = `function updateUserInfo(){
  var name = getUserDisplayName();
  var nickname = '@player_' + formatUserId(tgUserId);
  if (tgUser && tgUser.username) {
    nickname = tgUser.username.startsWith('@') ? tgUser.username : '@' + tgUser.username;
  } else {
    var savedUsername = localStorage.getItem('bingio_user_username');
    if (savedUsername) nickname = savedUsername.startsWith('@') ? savedUsername : '@' + savedUsername;
  }

  var initial = name.charAt(0).toUpperCase() || '?';
  var idDisplay = formatUserId(tgUserId);

  // Profile & Wallet Screen Text
  setTxt('p-name', name);
  setTxt('wl-name', name);
  setTxt('p-id', 'ID: ' + idDisplay);
  setTxt('wl-id', 'ID: ' + idDisplay);

  // Redesigned Homepage Top Bar Text
  setTxt('home-user-name', (tgUser && tgUser.username ? '@' + tgUser.username.replace('@','') : name));
  // nickname hidden in topbar
  setTxt('home-user-id-val', idDisplay);

  // Avatars across screens
  var pImg = document.getElementById('p-avatar-img');
  var pLetter = document.getElementById('p-avatar-letter');
  var wlImg = document.getElementById('wl-avatar-img');
  var wlLetter = document.getElementById('wl-avatar-letter');
  var homeImg = document.getElementById('home-avatar-img');
  var homeLetter = document.getElementById('home-avatar-letter');

  if (tgUser && tgUser.photo_url) {
    if (pImg) { pImg.src = tgUser.photo_url; pImg.style.display = 'block'; }
    if (pLetter) pLetter.style.display = 'none';
    if (wlImg) { wlImg.src = tgUser.photo_url; wlImg.style.display = 'block'; }
    if (wlLetter) wlLetter.style.display = 'none';
    if (homeImg) { homeImg.src = tgUser.photo_url; homeImg.style.display = 'block'; }
    if (homeLetter) homeLetter.style.display = 'none';
  } else {
    if (pImg) pImg.style.display = 'none';
    if (pLetter) { pLetter.textContent = initial; pLetter.style.display = 'flex'; }
    if (wlImg) wlImg.style.display = 'none';
    if (wlLetter) { wlLetter.textContent = initial; wlLetter.style.display = 'flex'; }
    if (homeImg) homeImg.style.display = 'none';
    if (homeLetter) { homeLetter.textContent = initial; homeLetter.style.display = 'flex'; }
  }

  var pUsername = document.getElementById('p-username');
  var wlUsername = document.getElementById('wl-username');
  if (pUsername) { pUsername.textContent = nickname + ' (' + idDisplay + ')'; pUsername.style.display = 'block'; }
  if (wlUsername) { wlUsername.textContent = nickname + ' (' + idDisplay + ')'; wlUsername.style.display = 'block'; }

  var userRole = (tgUser && tgUser.is_admin) ? 'ADMIN' : (localStorage.getItem('bingio_user_role') || 'PLAYER');
  setTxt('home-user-role-badge', userRole);
}`;

const newUpdateUserInfo = `function updateUserInfo(){
  var nickname = getUserDisplayName();
  var handle = getUserHandle();
  var idDisplay = formatUserId(tgUserId);
  var initial = nickname.charAt(0).toUpperCase() || '?';

  // 1. Homepage Top Bar
  setTxt('home-user-name', nickname);
  var homeTag = document.getElementById('home-user-tag');
  if (homeTag) homeTag.textContent = handle;
  setTxt('home-user-id-val', idDisplay);

  // 2. Profile Screen
  setTxt('p-name', nickname);
  var pUsernameVal = document.getElementById('p-username-val');
  if (pUsernameVal) pUsernameVal.textContent = handle.replace('@', '');
  setTxt('p-id-val', idDisplay);
  setTxt('p-id', 'ID: ' + idDisplay);

  // 3. Wallet Screen
  setTxt('wl-name', nickname);
  var wlUsernameVal = document.getElementById('wl-username-val');
  if (wlUsernameVal) wlUsernameVal.textContent = handle.replace('@', '');
  setTxt('wl-id', 'ID: ' + idDisplay);

  // 4. Avatars across screens
  var pImg = document.getElementById('p-avatar-img');
  var pLetter = document.getElementById('p-avatar-letter');
  var wlImg = document.getElementById('wl-avatar-img');
  var wlLetter = document.getElementById('wl-avatar-letter');
  var homeImg = document.getElementById('home-avatar-img');
  var homeLetter = document.getElementById('home-avatar-letter');

  if (tgUser && tgUser.photo_url) {
    if (pImg) { pImg.src = tgUser.photo_url; pImg.style.display = 'block'; }
    if (pLetter) pLetter.style.display = 'none';
    if (wlImg) { wlImg.src = tgUser.photo_url; wlImg.style.display = 'block'; }
    if (wlLetter) wlLetter.style.display = 'none';
    if (homeImg) { homeImg.src = tgUser.photo_url; homeImg.style.display = 'block'; }
    if (homeLetter) homeLetter.style.display = 'none';
  } else {
    if (pImg) pImg.style.display = 'none';
    if (pLetter) { pLetter.textContent = initial; pLetter.style.display = 'flex'; }
    if (wlImg) wlImg.style.display = 'none';
    if (wlLetter) { wlLetter.textContent = initial; wlLetter.style.display = 'flex'; }
    if (homeImg) homeImg.style.display = 'none';
    if (homeLetter) { homeLetter.textContent = initial; homeLetter.style.display = 'flex'; }
  }

  var userRole = (tgUser && tgUser.is_admin) ? 'ADMIN' : (localStorage.getItem('bingio_user_role') || 'PLAYER');
  setTxt('home-user-role-badge', userRole);
}`;

html = html.replace(oldUpdateUserInfo, newUpdateUserInfo);

// 6. Update APP_TRANSLATIONS with lbl-edit-nickname
html = html.replace('"lbl-room-pick-history": "Game History",', '"lbl-room-pick-history": "Game History",\n    "lbl-edit-nickname": "Edit Nickname",');
html = html.replace('"lbl-room-pick-history": "የጨዋታ ታሪክ",', '"lbl-room-pick-history": "የጨዋታ ታሪክ",\n    "lbl-edit-nickname": "መጠሪያ ስም ቀይር",');

fs.writeFileSync(indexPath, html, 'utf8');
console.log('Applied Nickname, Username tag, and Profile ID updates successfully! New length:', html.length);
