const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(filePath, 'utf8');

// 1. Remove manual WATCH LIVE GAME button from running-overlay
const watchBtnPattern = /<button onclick="spectateLiveGame\(\)"[^>]*>[\s\S]*?<\/button>/;
if (watchBtnPattern.test(html)) {
  html = html.replace(watchBtnPattern, '');
  console.log('[✓] Removed manual WATCH LIVE GAME button from running-overlay');
}

// 2. In countdown_update, if game is running and user is on screen-home, automatically spectate
const oldCountdownOverlay = `      if (serverGameStatus === 'running' || serverGameStatus === 'celebrating') {
        if (runOverlay) runOverlay.style.display = 'flex';
      } else {
        if (runOverlay) runOverlay.style.display = 'none';
      }`;

const newCountdownOverlay = `      if (serverGameStatus === 'running') {
        var activeScreen = document.querySelector('.screen.active');
        if (activeScreen && activeScreen.id === 'screen-home') {
          spectateLiveGame();
        }
      } else {
        if (runOverlay) runOverlay.style.display = 'none';
      }`;

if (html.includes(oldCountdownOverlay)) {
  html = html.replace(oldCountdownOverlay, newCountdownOverlay);
  console.log('[✓] Auto-transition to live game when running instead of showing overlay button');
}

fs.writeFileSync(filePath, html, 'utf8');
console.log('Done updating running-overlay behavior.');
