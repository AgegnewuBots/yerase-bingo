const fs = require('fs');
const path = require('path');

const serverJs = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');

const sIdx = serverJs.indexOf("socket.on('player_ready'");
console.log(serverJs.slice(sIdx, sIdx + 1500));
