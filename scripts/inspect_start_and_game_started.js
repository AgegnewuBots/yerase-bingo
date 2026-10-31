const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

const sm = html.match(/function startGame\(\)[\s\S]*?\n\}/);
console.log('--- function startGame() ---');
console.log(sm ? sm[0] : 'not found');

const gm = html.match(/socket\.on\('game_started'[\s\S]*?\n\s*\}\);/);
console.log('\n--- socket.on(game_started) ---');
console.log(gm ? gm[0] : 'not found');
