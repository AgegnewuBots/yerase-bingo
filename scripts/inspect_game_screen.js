const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

// Find screen-game div
const screenGameMatch = html.match(/<div class="screen"[^>]*id="screen-game"[\s\S]*?<\/div>\s*<!-- End screen-game/i) || 
                       html.match(/<div class="screen"[^>]*id="screen-game"[\s\S]*?(?=<div class="screen" id="screen-winner")/i);

console.log('--- SCREEN GAME HTML (first 1000 chars) ---');
if (screenGameMatch) {
  console.log(screenGameMatch[0].slice(0, 1000));
  console.log('Total length of screen-game:', screenGameMatch[0].length);
} else {
  console.log('Could not match screen-game');
}

// Find CSS for screen-game and .screen
console.log('\n--- CSS FOR .screen AND #screen-game ---');
const cssMatches = html.match(/(?:\.screen|#screen-game)\s*\{[^}]*\}/gi);
console.log(cssMatches);

// Find in-room-mode, in-game-mode CSS
console.log('\n--- in-room-mode / in-game-mode CSS ---');
const modeCss = html.match(/(?:\.in-room-mode|\.in-game-mode)[^{]*\{[^}]*\}/gi);
console.log(modeCss);
