const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

const sIdx = html.indexOf('id="screen-stake"');
const eIdx = html.indexOf('id="screen-home"');

console.log('--- SCREEN STAKE HTML ---');
console.log(html.slice(sIdx, eIdx));
