const fs = require('fs');
const path = require('path');

const lines = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8').split('\n');

const lineRanges = [
  [4660, 4700],
  [5755, 5785],
  [6340, 6370],
  [6920, 6950],
  [8035, 8065]
];

lineRanges.forEach(([start, end]) => {
  console.log(`\n================== LINES ${start} to ${end} ==================`);
  for (let i = start; i <= end && i <= lines.length; i++) {
    console.log(`${i}: ${lines[i - 1]}`);
  }
});
