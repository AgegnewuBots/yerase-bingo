const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

const fns = ['loadProfile', 'loadLeaderboard', 'loadWallet'];
fns.forEach(fn => {
  const m = html.match(new RegExp(`function ${fn}\\s*\\([\\s\\S]*?\\n\\}`, 'm'));
  console.log(`--- ${fn} ---`);
  console.log(m ? m[0] : 'Not found');
});

// Also check CSS for page-scroll, .screen, .app
console.log('\n--- CSS FOR .page-scroll, .app ---');
console.log(html.match(/(?:\.page-scroll|\.app)\s*\{[^}]*\}/gi));
