const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const sIdx = html.indexOf('id="with-req-phone"');
console.log(html.slice(sIdx - 100, sIdx + 1200));
