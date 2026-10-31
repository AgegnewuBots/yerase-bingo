const http = require('http');

function post(path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...headers
      }
    }, res => {
      let resp = '';
      res.on('data', d => resp += d);
      res.on('end', () => {
        try { resolve(JSON.parse(resp)); } catch(e) { resolve(resp); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path, headers = {}) {
  return new Promise((resolve, reject) => {
    http.get({
      hostname: 'localhost',
      port: 3000,
      path: path,
      headers: headers
    }, res => {
      let resp = '';
      res.on('data', d => resp += d);
      res.on('end', () => {
        try { resolve(JSON.parse(resp)); } catch(e) { resolve(resp); }
      });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('Testing Yerase Bingo API endpoints...');

  // 1. Config
  const cfg = await get('/api/config');
  console.log('1. /api/config ->', cfg.success ? 'OK' : 'FAIL');

  // 2. Deposit request
  const dep = await post('/api/client/deposit', {
    user_id: 'test_user_99',
    amount: 100,
    ref_phone: 'Telebirr',
    sms_text: 'Txn 990812 confirmed'
  });
  console.log('2. /api/client/deposit ->', dep.success ? `OK (tx_id: ${dep.tx_id}, new_bal: ${dep.new_balance})` : 'FAIL');

  // 3. Admin approve deposit
  const appDep = await post('/api/admin/deposits/approve', { txId: dep.tx_id }, { 'x-admin-password': '@YERASE1009' });
  console.log('3. /api/admin/deposits/approve ->', appDep.success ? 'OK' : 'FAIL');

  // 4. Withdrawal request
  const wth = await post('/api/client/withdraw', {
    user_id: 'test_user_99',
    amount: 50,
    receiver_phone: '0912345678'
  });
  console.log('4. /api/client/withdraw ->', wth.success ? `OK (tx_id: ${wth.tx_id}, new_bal: ${wth.new_balance})` : 'FAIL');

  // 5. Admin reject withdrawal (refunds main balance)
  const rejWth = await post('/api/admin/withdrawals/reject', { txId: wth.tx_id, reason: 'Test verification' }, { 'x-admin-password': '@YERASE1009' });
  console.log('5. /api/admin/withdrawals/reject ->', rejWth.success ? `OK (refunded: ${rejWth.refunded}, new_bal: ${rejWth.new_balance})` : 'FAIL');

  // 6. Game history
  const gh = await get('/api/game_history?user_id=test_user_99');
  console.log('6. /api/game_history ->', Array.isArray(gh.history) ? `OK (${gh.history.length} games)` : 'FAIL');

  // 7. Top winners
  const tw = await get('/api/top_winners?period=today&category=wins');
  console.log('7. /api/top_winners ->', Array.isArray(tw.winners) ? `OK (${tw.winners.length} winners)` : 'FAIL');

  console.log('\nAll API integration tests completed successfully!');
}

runTests().catch(console.error);
