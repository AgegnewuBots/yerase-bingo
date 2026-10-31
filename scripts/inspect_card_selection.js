const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

const m = html.match(/function toggleCard\b[\s\S]*?\n\}/) || html.match(/function selectCard\b[\s\S]*?\n\}/) || html.match(/function onCardClick\b[\s\S]*?\n\}/);
console.log('--- CARD SELECTION FUNCTION ---');
console.log(m ? m[0] : 'not found');

// Find all occurrences of selCards.add
const lines = html.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('selCards.add') || l.includes('selCards.delete')) {
    console.log(`${idx + 1}: ${l}`);
  }
});
