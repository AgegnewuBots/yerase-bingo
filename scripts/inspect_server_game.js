const fs = require('fs');
const path = require('path');

const serverJs = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');

const regexes = [
  /socket\.on\(['"]player_ready['"][\s\S]*?\n\s*\}\);/,
  /function startRoomGame[\s\S]*?\n\}/,
  /io\.to\(room\)\.emit\(['"]game_started['"][\s\S]*?\);/
];

regexes.forEach(r => {
  const m = serverJs.match(r);
  console.log('Match for ' + r + ':\n', m ? m[0].slice(0, 500) : 'not found');
});
