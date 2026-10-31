const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

// Find all function definitions: function foo() or async function foo()
const fnRegex = /(async\s+)?function\s+([a-zA-Z0-9_$]+)\s*\([^)]*\)\s*\{/g;
let m;
const missingAsync = [];

while ((m = fnRegex.exec(html)) !== null) {
  const isAsync = Boolean(m[1]);
  const fnName = m[2];
  const startIdx = m.index;
  
  // Find matching closing brace
  let braceCount = 1;
  let endIdx = startIdx + m[0].length;
  while (braceCount > 0 && endIdx < html.length) {
    if (html[endIdx] === '{') braceCount++;
    else if (html[endIdx] === '}') braceCount--;
    endIdx++;
  }
  
  const fnBody = html.slice(startIdx, endIdx);
  // Check if fnBody contains await (not inside a nested async function)
  if (!isAsync && /\bawait\s+/.test(fnBody)) {
    // Check if the await is inside a nested function or the function itself
    missingAsync.push({ name: fnName, snippet: fnBody.slice(0, 150) });
  }
}

console.log('Functions with await but missing async keyword:');
console.log(missingAsync);
