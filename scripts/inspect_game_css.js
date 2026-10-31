const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

const regexes = [
  /\.main\s*\{[^}]*\}/gi,
  /\.left-col\s*\{[^}]*\}/gi,
  /\.right-col\s*\{[^}]*\}/gi,
  /#screen-game[^{]*\{[^}]*\}/gi,
  /\.card-box\s*\{[^}]*\}/gi
];

regexes.forEach(r => {
  console.log('Matches for ' + r + ':', html.match(r));
});
