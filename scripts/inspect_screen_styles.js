const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

const regex = /<style>([\s\S]*?)<\/style>/gi;
let m;
let styleText = '';
while ((m = regex.exec(html)) !== null) {
  styleText += m[1] + '\n';
}

const lines = styleText.split('\n');
console.log('Searching for rules affecting screen height, page-scroll, or wallet/profile/winners...');
lines.forEach((l, idx) => {
  if (l.includes('page-scroll') || l.includes('screen-profile') || l.includes('screen-wallet') || l.includes('screen-winners') || l.includes('stat-box') || l.includes('rank-rows') || l.includes('wl-tx-rows')) {
    console.log(`${idx + 1}: ${l}`);
  }
});
