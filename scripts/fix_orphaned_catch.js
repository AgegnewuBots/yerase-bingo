const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(filePath, 'utf8');

const badSnippet = `function closeClientWithdrawModal() {
  if (soundOn) sfx.playClick();
  var modal = document.getElementById('client-withdraw-modal');
  if (modal) modal.classList.remove('active');
  var nav = document.getElementById('bottom-nav');
  if (nav && !document.body.classList.contains('in-room-mode')) {
    nav.style.setProperty('display', 'flex', 'important');
  }
}

 catch (err) {
    alert('Server connection error. Please try again.');
  }
}`;

const goodSnippet = `function closeClientWithdrawModal() {
  if (soundOn) sfx.playClick();
  var modal = document.getElementById('client-withdraw-modal');
  if (modal) modal.classList.remove('active');
  var nav = document.getElementById('bottom-nav');
  if (nav && !document.body.classList.contains('in-room-mode')) {
    nav.style.setProperty('display', 'flex', 'important');
  }
}`;

if (html.includes(badSnippet)) {
  html = html.replace(badSnippet, goodSnippet);
  fs.writeFileSync(filePath, html, 'utf8');
  console.log('[✓] Removed orphaned catch block successfully!');
} else {
  console.log('[!] badSnippet not matched directly, checking whitespace...');
  const regex = /function closeClientWithdrawModal\(\)\s*\{[\s\S]*?\}\s*catch\s*\(err\)\s*\{\s*alert\('Server connection error\. Please try again\.'\);\s*\}\s*\}/;
  if (regex.test(html)) {
    html = html.replace(regex, goodSnippet);
    fs.writeFileSync(filePath, html, 'utf8');
    console.log('[✓] Removed orphaned catch block via regex!');
  } else {
    console.error('Failed to match bad snippet.');
  }
}
