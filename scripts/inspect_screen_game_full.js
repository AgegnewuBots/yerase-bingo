const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

const sIdx = html.indexOf('id="screen-game"');
const eIdx = html.indexOf('id="screen-winner"');

console.log('--- SCREEN GAME HTML ---');
console.log(html.slice(sIdx, eIdx));
