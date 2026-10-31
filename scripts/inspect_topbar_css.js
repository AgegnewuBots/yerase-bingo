const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

const regexes = [
  /\.topbar\s*\{[^}]*\}/gi,
  /#home-topbar-card\s*\{[^}]*\}/gi,
  /\.home-topbar-card\s*\{[^}]*\}/gi,
  /#screen-winners[^{]*\{[^}]*\}/gi,
  /#screen-wallet[^{]*\{[^}]*\}/gi,
  /#screen-profile[^{]*\{[^}]*\}/gi,
  /\.page-scroll\s*\{[^}]*\}/gi,
  /\.screen\s*\{[^}]*\}/gi
];

regexes.forEach(r => {
  const matches = html.match(r);
  console.log('Matches for ' + r + ':', matches);
});
