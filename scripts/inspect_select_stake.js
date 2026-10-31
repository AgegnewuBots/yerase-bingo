const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

const m = html.match(/function selectStake\([\s\S]*?\n\}/);
console.log('--- selectStake ---');
console.log(m ? m[0] : 'not found');
