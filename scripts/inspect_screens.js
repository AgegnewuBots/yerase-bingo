const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

['screen-winners', 'screen-wallet', 'screen-profile'].forEach(id => {
  const regex = new RegExp(`<div class="screen"[^>]*id="${id}"[\\s\\S]*?<\\/div>\\s*<!-- End ${id}`, 'i');
  let match = html.match(regex);
  if (!match) {
    // fallback match
    const startIdx = html.indexOf(`id="${id}"`);
    if (startIdx !== -1) {
      console.log(`Found ${id} at index ${startIdx}`);
      console.log(html.slice(startIdx - 30, startIdx + 800));
    } else {
      console.log(`Could not find ${id}`);
    }
  } else {
    console.log(`Found ${id}, length: ${match[0].length}`);
    console.log(match[0].slice(0, 400));
  }
});
