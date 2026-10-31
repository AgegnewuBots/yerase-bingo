const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

html = html.replace("alert('🏆 YERASE BINGO VIP MEMBER CLUB", "alert('YERASE BINGO VIP MEMBER CLUB");
html = html.replace("showToast('🏆 BINGO! YOU COMPLETED A WINNING LINE!');", "showToast('BINGO! YOU COMPLETED A WINNING LINE!', true);");
html = html.replace("showToast(currentRulesLang === 'am' ? '🏆 ቢንጎ! እንኳን ደስ አለዎት!' : '🏆 BINGO CLAIMED! CONGRATULATIONS!');", "showToast(currentRulesLang === 'am' ? 'ቢንጎ! እንኳን ደስ አለዎት!' : 'BINGO CLAIMED! CONGRATULATIONS!', true);");
html = html.replace(/sendBrowserNotification\('YERASE BINGO 🏆'/g, "sendBrowserNotification('YERASE BINGO'");
html = html.replace("var medal = i === 0 ? '' : i === 1 ? '🥈 ' : i === 2 ? '🥉 ' : '';", 
  'var medal = i === 0 ? \'<i class="fa-solid fa-crown" style="color:#FCD34D; margin-right:4px;"></i>\' : i === 1 ? \'<i class="fa-solid fa-medal" style="color:#CBD5E1; margin-right:4px;"></i>\' : i === 2 ? \'<i class="fa-solid fa-medal" style="color:#D97706; margin-right:4px;"></i>\' : \'\';');

const cleanShare = 'var shareText = "BINGO! I just won a match on Yerase Bingo!\\nCard Prize Pool: " + prizeText + " ETB!\\nCome play the ultimate Ethiopian Bingo game right inside Telegram! Quick deposits, instant payouts, and huge jackpots!\\nStart playing now: https://t.me/Yerasegame";';
html = html.replace(/var shareText = [^;]+;/, cleanShare);

fs.writeFileSync('index.html', html, 'utf8');
console.log('Cleaned remaining emojis in index.html');
