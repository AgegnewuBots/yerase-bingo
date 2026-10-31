const fs = require('fs');
const vm = require('vm');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let count = 0;
let errors = 0;

while ((match = scriptRegex.exec(html)) !== null) {
  count++;
  const code = match[1];
  // Skip JSON or external scripts with no inline code
  if (!code.trim()) continue;
  if (match[0].includes('type="application/json"') || match[0].includes('type="application/ld+json"')) {
    try {
      JSON.parse(code);
      console.log(`Script #${count} (JSON): Valid.`);
    } catch(e) {
      console.error(`Script #${count} (JSON) Error:`, e.message);
      errors++;
    }
    continue;
  }

  try {
    new vm.Script(code);
    console.log(`Script #${count} (JS): Syntax OK.`);
  } catch(e) {
    console.error(`Script #${count} (JS) Error:`, e.message);
    errors++;
  }
}

console.log(`\nValidation complete: ${count} script tags checked. Total errors: ${errors}`);
if (errors > 0) process.exit(1);
