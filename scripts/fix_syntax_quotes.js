const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(filePath, 'utf8');

// Fix unescaped double quotes in translation strings
const target1 = '"lbl-wal-policy-desc": "<i class="fa-solid fa-circle-info" style="color:var(--gold); margin-right:4px;"></i><strong>Withdrawal Policy:</strong> Deposited funds and winnings are withdrawable once you have deposited at least 50 ETB and wagered 15x your total deposit amount.",';
const repl1 = '"lbl-wal-policy-desc": "<i class=\\"fa-solid fa-circle-info\\" style=\\"color:var(--gold); margin-right:4px;\\"></i><strong>Withdrawal Policy:</strong> Deposited funds and winnings are withdrawable once you have deposited at least 50 ETB and wagered 15x your total deposit amount.",';

const target2 = '"lbl-wal-policy-desc": "<i class="fa-solid fa-circle-info" style="color:var(--gold); margin-right:4px;"></i><strong>የማውጣት ደንብ፦</strong> ተቀማጭ ገንዘብ እና ያሸነፉትን ለማውጣት ቢያንስ 50 ብር ማስገባት እና የተጣራውን 15 እጥፍ መጫወት ያስፈልጋል።",';
const repl2 = '"lbl-wal-policy-desc": "<i class=\\"fa-solid fa-circle-info\\" style=\\"color:var(--gold); margin-right:4px;\\"></i><strong>የማውጣት ደንብ፦</strong> ተቀማጭ ገንዘብ እና ያሸነፉትን ለማውጣት ቢያንስ 50 ብር ማስገባት እና የተጣራውን 15 እጥፍ መጫወት ያስፈልጋል።",';

if (html.includes(target1)) {
  html = html.replace(target1, repl1);
  console.log('[✓] Fixed English lbl-wal-policy-desc');
} else {
  console.log('[!] target1 not found exactly');
}

if (html.includes(target2)) {
  html = html.replace(target2, repl2);
  console.log('[✓] Fixed Amharic lbl-wal-policy-desc');
} else {
  console.log('[!] target2 not found exactly');
}

fs.writeFileSync(filePath, html, 'utf8');
console.log('Done writing fix.');
