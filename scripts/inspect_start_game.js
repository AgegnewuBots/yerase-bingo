const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

const regexes = [
  /function startGame\([\s\S]*?\n\}/,
  /socket\.on\(['"]round_started['"][\s\S]*?\n\s*\}\);/,
  /socket\.on\(['"]game_started['"][\s\S]*?\n\s*\}\);/,
  /socket\.on\(['"]start_game['"][\s\S]*?\n\s*\}\);/
];

regexes.forEach(r => {
  const m = html.match(r);
  console.log('Match for ' + r + ':\n', m ? m[0].slice(0, 500) : 'not found');
});
