const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

// Find the start of <body> and the first screen
const bodyStart = html.indexOf('<body');
const stakeStart = html.indexOf('id="screen-stake"');

console.log('--- BETWEEN <body> AND screen-stake ---');
console.log(html.slice(bodyStart, stakeStart + 60));
