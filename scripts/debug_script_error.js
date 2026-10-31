const fs = require('fs');
const vm = require('vm');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let count = 0;

while ((match = scriptRegex.exec(html)) !== null) {
  count++;
  if (count === 7) {
    const code = match[1];
    const lines = code.split('\n');
    for (let i = 1; i <= lines.length; i++) {
      try {
        new vm.Script(lines.slice(0, i).join('\n'));
      } catch (e) {
        if (!e.message.includes('Unexpected end of input') && !e.message.includes('missing')) {
          console.log(`Error around line ${i}: ${e.message}`);
          console.log(lines.slice(Math.max(0, i - 5), Math.min(lines.length, i + 5)).map((l, idx) => `${Math.max(0, i - 5) + idx + 1}: ${l}`).join('\n'));
          break;
        }
      }
    }
    break;
  }
}
