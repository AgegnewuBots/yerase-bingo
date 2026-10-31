const fs = require('fs');
const vm = require('vm');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

// Mock browser environment
const dom = {};
const elements = [
  'home-user-name', 'home-user-tag', 'home-user-id-val', 'home-user-role-badge',
  'p-name', 'p-username-val', 'p-id-val', 'p-id', 'p-bal', 'p-nickname-badge',
  'wl-name', 'wl-username-val', 'wl-id', 'wl-bal',
  'p-avatar-img', 'p-avatar-letter', 'wl-avatar-img', 'wl-avatar-letter',
  'home-avatar-img', 'home-avatar-letter'
];

elements.forEach(id => {
  dom[id] = {
    id: id,
    textContent: '',
    style: {},
    classList: { add: () => {}, remove: () => {} },
    setAttribute: () => {},
    getAttribute: () => null
  };
});

const storage = {};
const mockWindow = {
  document: {
    getElementById: (id) => dom[id] || null
  },
  localStorage: {
    getItem: (k) => storage[k] || null,
    setItem: (k, v) => { storage[k] = String(v); },
    removeItem: (k) => { delete storage[k]; }
  },
  Telegram: {
    WebApp: {
      initDataUnsafe: {
        user: {
          id: 3050692752,
          first_name: 'Anteneh',
          last_name: 'Agegnewu',
          username: 'Agegnewu_1'
        }
      }
    }
  },
  console: console,
  fetch: async () => ({ ok: true, json: async () => ({ ok: true }) }),
  API_BASE: 'http://localhost:3000',
  currentRulesLang: 'en',
  soundOn: false,
  sfx: { playClick: () => {} },
  showToast: (m) => console.log('TOAST:', m),
  formatUserId: (id) => String(id)
};

// Extract functions from index.html
const extractFn = (fnName) => {
  const match = html.match(new RegExp(`(function\\s+${fnName}\\s*\\([\\s\\S]*?\\n\\})`, 'm'));
  return match ? match[1] : null;
};

const context = vm.createContext({
  ...mockWindow,
  tgUser: mockWindow.Telegram.WebApp.initDataUnsafe.user,
  tgUserId: 3050692752,
  setTxt: (id, txt) => {
    if (dom[id]) dom[id].textContent = txt;
  }
});

// Run getUserDisplayName, getUserHandle, updateUserInfo
vm.runInContext(extractFn('getUserDisplayName'), context);
vm.runInContext(extractFn('getUserHandle'), context);
vm.runInContext(extractFn('updateUserInfo'), context);

console.log('Testing default Telegram user display:');
vm.runInContext('updateUserInfo()', context);
console.log('  TopBar name:', dom['home-user-name'].textContent);
console.log('  TopBar handle tag:', dom['home-user-tag'].textContent);
console.log('  TopBar ID:', dom['home-user-id-val'].textContent);
console.log('  Profile name:', dom['p-name'].textContent);
console.log('  Profile username val:', dom['p-username-val'].textContent);
console.log('  Profile ID:', dom['p-id-val'].textContent);
console.log('  Wallet name:', dom['wl-name'].textContent);
console.log('  Wallet username val:', dom['wl-username-val'].textContent);
console.log('  Wallet ID:', dom['wl-id'].textContent);

// Test custom nickname
console.log('\nTesting custom nickname update:');
storage['bingio_user_nickname'] = 'HabeshaKing';
vm.runInContext('updateUserInfo()', context);
console.log('  TopBar name (after custom nickname):', dom['home-user-name'].textContent);
console.log('  TopBar handle tag (remains telegram handle):', dom['home-user-tag'].textContent);
console.log('  Profile name (after custom nickname):', dom['p-name'].textContent);
console.log('  Wallet name (after custom nickname):', dom['wl-name'].textContent);

if (dom['home-user-name'].textContent === 'HabeshaKing' &&
    dom['home-user-tag'].textContent === '@Agegnewu_1' &&
    dom['home-user-id-val'].textContent === '3050692752' &&
    dom['p-name'].textContent === 'HabeshaKing' &&
    dom['p-username-val'].textContent === 'Agegnewu_1') {
  console.log('\n[PASS] All User Nickname, Username, and Profile ID tests PASSED flawlessly!');
} else {
  console.error('\n[FAIL] Test assertion failed!');
  process.exit(1);
}
