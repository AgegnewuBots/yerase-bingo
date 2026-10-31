const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

// Print navTo function
const navToMatch = html.match(/function navTo\([\s\S]*?\n\}/);
console.log('--- navTo FUNCTION ---');
console.log(navToMatch ? navToMatch[0] : 'navTo not found');

// Print showScreen function
const showScreenMatch = html.match(/function showScreen\([\s\S]*?\n\}/);
console.log('\n--- showScreen FUNCTION ---');
console.log(showScreenMatch ? showScreenMatch[0] : 'showScreen not found');

// Find all elements with class="screen"
console.log('\n--- SCREENS WITH CLASS SCREEN ---');
const screens = html.match(/<div[^>]*class="[^"]*screen[^"]*"[^>]*>/gi);
console.log(screens);

// Find bottom nav or elements with id starting with nav-
console.log('\n--- NAV ELEMENTS ---');
const navElements = html.match(/<[^>]*id="nav-[^"]*"[^>]*>/gi);
console.log(navElements);
