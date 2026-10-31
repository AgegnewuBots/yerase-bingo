const fs = require('fs');
const path = require('path');

const lines = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8').split('\n');

console.log('--- LINES 5670 to 5720 ---');
for (let i = 5670; i <= 5720; i++) console.log(`${i}: ${lines[i-1]}`);

console.log('\n--- LINES 6820 to 6860 ---');
for (let i = 6820; i <= 6860; i++) console.log(`${i}: ${lines[i-1]}`);
