const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

const sIdxWinners = html.indexOf('id="screen-winners"');
const sIdxWallet = html.indexOf('id="screen-wallet"');
const sIdxProfile = html.indexOf('id="screen-profile"');

console.log('--- screen-winners (first 600 chars) ---');
console.log(html.slice(sIdxWinners, sIdxWinners + 600));

console.log('\n--- screen-wallet (first 600 chars) ---');
console.log(html.slice(sIdxWallet, sIdxWallet + 600));

console.log('\n--- screen-profile (first 600 chars) ---');
console.log(html.slice(sIdxProfile, sIdxProfile + 600));
