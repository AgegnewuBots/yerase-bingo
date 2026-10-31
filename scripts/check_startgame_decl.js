const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const lines = html.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('function startGame')) {
    console.log(`${idx + 1}: ${l}`);
  }
});
