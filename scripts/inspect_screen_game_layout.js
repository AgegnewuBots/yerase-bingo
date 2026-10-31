const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

const regex = /@media[^{]*\([^)]*max-width[^)]*\)[^{]*\{[\s\S]*?#screen-game[\s\S]*?\}/gi;
console.log('Media queries for screen-game:');
console.log(html.match(regex));

const lines = html.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('.main{') || l.includes('#screen-game{') || l.includes('.left-col{') || l.includes('.right-col{')) {
    console.log(`${idx + 1}: ${l}`);
  }
});
