const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

const fns = ['renderNumGrid', 'renderRecentBalls', 'renderCard', 'renderAllCards'];
fns.forEach(fn => {
  const m = html.match(new RegExp(`function ${fn}\\s*\\([\\s\\S]*?\\n\\}`, 'm'));
  console.log(`--- ${fn} ---`);
  console.log(m ? m[0].slice(0, 400) : 'not found');
});
