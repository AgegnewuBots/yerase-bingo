const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const sIdx = html.indexOf('id="running-overlay"');
console.log(html.slice(sIdx - 50, sIdx + 1100));
