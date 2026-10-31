const fs = require('fs');
const vm = require('vm');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

// Set up mock DOM elements
const elements = {};
function getOrCreateElement(id) {
  if (!elements[id]) {
    elements[id] = {
      id: id,
      classList: {
        _classes: new Set(),
        add: function(c) { this._classes.add(c); },
        remove: function(c) { this._classes.delete(c); },
        contains: function(c) { return this._classes.has(c); },
        toggle: function(c, val) {
          if (val === undefined) val = !this.contains(c);
          if (val) this.add(c); else this.remove(c);
          return val;
        }
      },
      style: {
        setProperty: function(prop, val) { this[prop] = val; }
      },
      textContent: '',
      innerHTML: '',
      querySelectorAll: function() { return []; },
      querySelector: function() { return null; }
    };
  }
  return elements[id];
}

const mockDoc = {
  getElementById: (id) => getOrCreateElement(id),
  querySelectorAll: (selector) => {
    if (selector === '.screen') {
      return ['screen-stake', 'screen-winners', 'screen-wallet', 'screen-profile', 'screen-home', 'screen-game', 'screen-winner'].map(getOrCreateElement);
    }
    if (selector === '.nav-btn') {
      return ['nav-home', 'nav-winners', 'nav-wallet', 'nav-profile'].map(getOrCreateElement);
    }
    return [];
  },
  querySelector: (sel) => {
    if (sel === '.app') return getOrCreateElement('app-root');
    return null;
  },
  body: {
    classList: getOrCreateElement('body').classList
  }
};

const storage = {
  bingio_user_id: '3050692752',
  bingio_user_name: 'Anteneh'
};

const mockWindow = {
  document: mockDoc,
  localStorage: {
    getItem: (k) => storage[k] || null,
    setItem: (k, v) => { storage[k] = String(v); },
    removeItem: (k) => { delete storage[k]; }
  },
  Telegram: {
    WebApp: {
      initDataUnsafe: {
        user: { id: 3050692752, first_name: 'Anteneh', username: 'Agegnewu_1' }
      },
      showAlert: () => {}
    }
  },
  scrollTo: () => {},
  console: console,
  currentRulesLang: 'en',
  soundOn: false,
  sfx: { playClick: () => {}, playLoss: () => {}, playCountdown: () => {} },
  triggerHaptic: () => {},
  formatUserId: (id) => String(id),
  userMainBalance: 150,
  userPlayBalance: 200,
  setTxt: (id, txt) => { getOrCreateElement(id).textContent = txt; }
};

// Extract functions
function extractFn(name) {
  const m = html.match(new RegExp(`(async\\s+)?function\\s+${name}\\s*\\([\\s\\S]*?\\n\\}`, 'm'));
  return m ? m[0] : '';
}

const ctxObj = {
  ...mockWindow,
  tgUserId: '3050692752',
  tgUser: mockWindow.Telegram.WebApp.initDataUnsafe.user,
  fetchBalance: async () => {},
  loadProfile: async () => {},
  loadLeaderboard: async () => {},
  loadWallet: async () => {}
};
ctxObj.window = ctxObj;
const context = vm.createContext(ctxObj);

vm.runInContext(extractFn('showScreen'), context);
vm.runInContext(extractFn('navTo'), context);

console.log('Testing Navigation & Screen Display Rules:');

// Test 1: On Home Screen (screen-stake)
vm.runInContext("navTo('home')", context);
const homeTopbar = getOrCreateElement('home-topbar-card');
const bottomNav = getOrCreateElement('bottom-nav');
const screenStake = getOrCreateElement('screen-stake');

console.log('  1. Nav to Home:');
console.log('     screen-stake active:', screenStake.classList.contains('active'));
console.log('     home-topbar-card display:', homeTopbar.style.display);
console.log('     bottom-nav display:', bottomNav.style.display);
if (homeTopbar.style.display !== 'flex') throw new Error('Home topbar should be flex on Home screen');

// Test 2: On Winners Screen (screen-winners)
vm.runInContext("navTo('winners')", context);
const screenWinners = getOrCreateElement('screen-winners');
console.log('  2. Nav to Winners:');
console.log('     screen-winners active:', screenWinners.classList.contains('active'));
console.log('     home-topbar-card display (MUST BE NONE):', homeTopbar.style.display);
console.log('     bottom-nav display:', bottomNav.style.display);
if (homeTopbar.style.display !== 'none') throw new Error('Home topbar must be none on Winners screen');
if (bottomNav.style.display !== 'flex') throw new Error('Bottom nav must be flex on Winners screen');

// Test 3: On Wallet Screen (screen-wallet)
vm.runInContext("navTo('wallet')", context);
const screenWallet = getOrCreateElement('screen-wallet');
console.log('  3. Nav to Wallet:');
console.log('     screen-wallet active:', screenWallet.classList.contains('active'));
console.log('     home-topbar-card display (MUST BE NONE):', homeTopbar.style.display);
console.log('     bottom-nav display:', bottomNav.style.display);
if (homeTopbar.style.display !== 'none') throw new Error('Home topbar must be none on Wallet screen');
if (bottomNav.style.display !== 'flex') throw new Error('Bottom nav must be flex on Wallet screen');

// Test 4: On Profile Screen (screen-profile)
vm.runInContext("navTo('profile')", context);
const screenProfile = getOrCreateElement('screen-profile');
console.log('  4. Nav to Profile:');
console.log('     screen-profile active:', screenProfile.classList.contains('active'));
console.log('     home-topbar-card display (MUST BE NONE):', homeTopbar.style.display);
console.log('     bottom-nav display:', bottomNav.style.display);
if (homeTopbar.style.display !== 'none') throw new Error('Home topbar must be none on Profile screen');
if (bottomNav.style.display !== 'flex') throw new Error('Bottom nav must be flex on Profile screen');

// Test 5: In-Room Screen (screen-home)
vm.runInContext("showScreen('screen-home')", context);
console.log('  5. In-Room screen (screen-home):');
console.log('     home-topbar-card display (MUST BE NONE):', homeTopbar.style.display);
console.log('     bottom-nav display (MUST BE NONE):', bottomNav.style.display);
if (homeTopbar.style.display !== 'none') throw new Error('Home topbar must be none in Room');
if (bottomNav.style.display !== 'none') throw new Error('Bottom nav must be none in Room');

// Test 6: In-Game Screen (screen-game)
vm.runInContext("showScreen('screen-game')", context);
console.log('  6. In-Game screen (screen-game):');
console.log('     home-topbar-card display (MUST BE NONE):', homeTopbar.style.display);
console.log('     bottom-nav display (MUST BE NONE):', bottomNav.style.display);
if (homeTopbar.style.display !== 'none') throw new Error('Home topbar must be none in Game');
if (bottomNav.style.display !== 'none') throw new Error('Bottom nav must be none in Game');

console.log('\n[PASS] ALL NAVIGATION AND SCREEN VISIBILITY TESTS PASSED 100%!');
