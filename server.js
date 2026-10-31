// ============================================================================
// YERASE BINGO (የራሴ ቢንጎ) - REAL MULTIPLAYER SERVER & GAME ENGINE
// Express + Socket.io Server with Multi-Room Synchronized Real-Time State
// ============================================================================

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const db = require('./database');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend files (index.html, dist, css, js)
app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;

// Deterministic card generator (exact match with client)
function generateCardDeterministic(cardId) {
  let seed = Number(cardId) || 1;
  function random() {
    let x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }
  
  const card = new Array(25);
  for (let c = 0; c < 5; c++) {
    const min = c * 15 + 1;
    const max = c * 15 + 15;
    const pool = [];
    for (let i = min; i <= max; i++) pool.push(i);
    
    // Seeded shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      const t = pool[i];
      pool[i] = pool[j];
      pool[j] = t;
    }
    
    for (let r = 0; r < 5; r++) {
      const idx = r * 5 + c;
      card[idx] = { c: c, r: r, n: pool[r] };
    }
  }
  card[12] = { c: 2, r: 2, n: '★' };
  return card;
}

// Win validation helper
function verifyWin(card, calledNumbersSet) {
  const marked = new Set();
  card.forEach((cell, idx) => {
    if (cell.n === '★' || idx === 12 || calledNumbersSet.has(cell.n)) {
      marked.add(idx);
    }
  });

  const lines = [];
  // rows
  for (let r = 0; r < 5; r++) lines.push([r*5, r*5+1, r*5+2, r*5+3, r*5+4]);
  // cols
  for (let c = 0; c < 5; c++) lines.push([c, c+5, c+10, c+15, c+20]);
  // diagonals
  lines.push([0, 6, 12, 18, 24]);
  lines.push([4, 8, 12, 16, 20]);
  // corners
  lines.push([0, 4, 20, 24]);

  for (const line of lines) {
    if (line.every(idx => marked.has(idx))) {
      return true;
    }
  }
  return false;
}

function generateGameId() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = letters.charAt(Math.floor(Math.random() * letters.length)) + 
           letters.charAt(Math.floor(Math.random() * letters.length));
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

// Admin Panel endpoint
app.get(['/admin', '/addmin'], (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Admin Auth Middleware
function requireAdmin(req, res, next) {
  const pwd = req.headers['x-admin-password'];
  if (pwd === '@YERASE1009' || pwd === '@JUBA1009') {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized admin access' });
  }
}

// Client configuration endpoint
app.get('/api/config', async (req, res) => {
  try {
    const settings = await db.getSystemSettings();
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Client deposit submission
const handleDepositRequest = async (req, res) => {
  const { user_id, amount, ref_phone, ref, sms_text, sms } = req.body;
  if (!user_id || !amount) return res.status(400).json({ error: 'Missing parameters' });
  if (parseFloat(amount) <= 0) return res.status(400).json({ error: 'Invalid amount' });
  
  const result = await db.createDepositRequest(user_id, amount, ref_phone || ref, sms_text || sms);
  if (result.success) {
    res.json({ success: true, tx_id: result.tx_id, new_balance: result.new_balance });
  } else {
    res.status(400).json({ error: result.error });
  }
};
app.post('/api/deposit/request', handleDepositRequest);
app.post('/api/client/deposit', handleDepositRequest);

// Client withdrawal submission
const handleWithdrawRequest = async (req, res) => {
  const { user_id, amount, receiver_phone, phone } = req.body;
  if (!user_id || !amount) return res.status(400).json({ error: 'Missing parameters' });
  if (parseFloat(amount) <= 0) return res.status(400).json({ error: 'Invalid amount' });

  const result = await db.createWithdrawRequest(user_id, amount, receiver_phone || phone);
  if (result.success) {
    res.json({ success: true, tx_id: result.tx_id, new_balance: result.new_balance });
  } else {
    res.status(400).json({ error: result.error });
  }
};
app.post('/api/withdraw/request', handleWithdrawRequest);
app.post('/api/client/withdraw', handleWithdrawRequest);

// Admin endpoints
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === '@YERASE1009' || password === '@JUBA1009') {
    res.json({ success: true, token: '@YERASE1009' });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

app.get('/api/admin/stats', requireAdmin, async (req, res) => {
  try {
    const users = await db.getAllUsers();
    let totalMain = 0;
    let totalPlay = 0;
    users.forEach(u => {
      totalMain += parseFloat(u.main_balance || 0);
      totalPlay += parseFloat(u.play_balance || 0);
    });

    res.json({
      success: true,
      total_users: users.length,
      total_main_balance: totalMain,
      total_play_balance: totalPlay,
      active_rooms: Object.keys(rooms).length
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve stats' });
  }
});

app.get('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const users = await db.getAllUsers();
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
});

app.post('/api/admin/users/update', requireAdmin, async (req, res) => {
  const { userId, first_name, main_balance, play_balance, password } = req.body;
  if (!userId) return res.status(400).json({ error: 'User ID is required' });
  const success = await db.updateUserByAdmin(userId, { first_name, main_balance, play_balance, password });
  res.json({ success: Boolean(success) });
});

app.post('/api/admin/users/ban', requireAdmin, async (req, res) => {
  const { userId, reason } = req.body;
  if (!userId) return res.status(400).json({ error: 'User ID is required' });
  const success = await db.banUser(userId, reason);
  res.json({ success: Boolean(success) });
});

app.post('/api/admin/users/unban', requireAdmin, async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'User ID is required' });
  const success = await db.unbanUser(userId);
  res.json({ success: Boolean(success) });
});

app.post('/api/admin/users/grant_bonus_all', requireAdmin, async (req, res) => {
  const { amount } = req.body;
  const grantAmount = parseFloat(amount) || 50;
  const success = await db.grantBonusAllUsers(grantAmount);
  res.json({ success: Boolean(success), message: `Granted ${grantAmount} ETB play bonus to all users.` });
});

app.get('/api/admin/deposits', requireAdmin, async (req, res) => {
  try {
    const deposits = await db.getPendingDeposits();
    res.json({ success: true, deposits });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve pending deposits' });
  }
});

app.get('/api/admin/withdrawals', requireAdmin, async (req, res) => {
  try {
    const withdrawals = await db.getPendingWithdrawals();
    res.json({ success: true, withdrawals });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve pending withdrawals' });
  }
});

app.post('/api/admin/deposits/approve', requireAdmin, async (req, res) => {
  const { txId, tx_id } = req.body;
  const targetId = txId || tx_id;
  if (!targetId) return res.status(400).json({ error: 'Transaction ID is required' });
  const result = await db.approveDeposit(targetId);
  res.json(result);
});

app.post('/api/admin/deposits/reject', requireAdmin, async (req, res) => {
  const { txId, tx_id, reason } = req.body;
  const targetId = txId || tx_id;
  if (!targetId) return res.status(400).json({ error: 'Transaction ID is required' });
  const result = await db.rejectDeposit(targetId, reason);
  res.json(result);
});

app.post('/api/admin/withdrawals/approve', requireAdmin, async (req, res) => {
  const { txId, tx_id } = req.body;
  const targetId = txId || tx_id;
  if (!targetId) return res.status(400).json({ error: 'Transaction ID is required' });
  const result = await db.approveWithdrawal(targetId);
  res.json(result);
});

app.post('/api/admin/withdrawals/reject', requireAdmin, async (req, res) => {
  const { txId, tx_id, reason } = req.body;
  const targetId = txId || tx_id;
  if (!targetId) return res.status(400).json({ error: 'Transaction ID is required' });
  const result = await db.rejectWithdrawal(targetId, reason);
  res.json(result);
});

app.get('/api/admin/transactions', requireAdmin, async (req, res) => {
  try {
    const transactions = await db.getAllTransactions();
    res.json({ success: true, transactions });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve transactions' });
  }
});

app.get('/api/admin/games', requireAdmin, async (req, res) => {
  try {
    const games = await db.getAllGames();
    res.json({ success: true, games });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve games' });
  }
});

app.get('/api/system_settings', async (req, res) => {
  try {
    const settings = await db.getSystemSettings();
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve settings' });
  }
});

app.post('/api/admin/settings/update', requireAdmin, async (req, res) => {
  try {
    const { max_cards, min_players, maintenance, min_withdraw, bot_link, support_link } = req.body;
    const updates = {};
    if (max_cards !== undefined) updates.max_cards = parseInt(max_cards, 10);
    if (min_players !== undefined) updates.min_players = parseInt(min_players, 10);
    if (maintenance !== undefined) updates.maintenance = Boolean(maintenance);
    if (min_withdraw !== undefined) updates.min_withdraw = parseFloat(min_withdraw);
    if (bot_link) updates.bot_link = bot_link;
    if (support_link) updates.support_link = support_link;

    await db.updateSystemSettings(updates);
    const updated = await db.getSystemSettings();
    io.emit('system_settings_updated', updated);
    res.json({ success: true, settings: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

app.get('/api/admin/settings', requireAdmin, async (req, res) => {
  try {
    const settings = await db.getSystemSettings();
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve settings' });
  }
});

app.post('/api/admin/settings', requireAdmin, async (req, res) => {
  try {
    await db.updateSystemSettings(req.body);
    const updated = await db.getSystemSettings();
    io.emit('system_settings_updated', updated);
    res.json({ success: true, settings: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// User & Wallet Endpoints
app.get('/api/balance', async (req, res) => {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ error: 'User ID is required' });
  const user = await db.getUser(user_id);
  res.json({
    main_balance: user.main_balance || 0,
    play_balance: user.play_balance || 0,
    has_password: Boolean(user.password),
    first_name: user.first_name || '',
    username: user.username || ''
  });
});

app.post('/api/auth/register', async (req, res) => {
  const { name, phone, password } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone is required' });
  const result = await db.registerWebUser(name, phone, password);
  if (result.success) {
    res.json({ success: true, user: result.user });
  } else {
    res.status(400).json({ error: result.error });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { phone, password } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone is required' });
  const result = await db.loginWebUser(phone, password);
  if (result.success) {
    res.json({ success: true, user: result.user });
  } else {
    res.status(400).json({ error: result.error });
  }
});

app.post('/api/auth/set_password', async (req, res) => {
  const { user_id, password } = req.body;
  if (!user_id || !password) return res.status(400).json({ error: 'Missing parameters' });
  await db.setUserPassword(user_id, password);
  res.json({ success: true });
});

app.post('/api/update_name', async (req, res) => {
  const { user_id, first_name, username } = req.body;
  if (!user_id) return res.status(400).json({ error: 'User ID is required' });
  await db.updateUserName(user_id, first_name, username);
  res.json({ success: true });
});

app.post('/api/bet', async (req, res) => {
  const { user_id, amount } = req.body;
  if (!user_id || !amount) return res.status(400).json({ error: 'Missing parameters' });
  const result = await db.deductBet(user_id, amount);
  if (result.success) {
    res.json(result);
  } else {
    res.status(400).json(result);
  }
});

app.post('/api/win', async (req, res) => {
  const { user_id, amount, game_id } = req.body;
  if (!user_id || !amount) return res.status(400).json({ error: 'Missing parameters' });
  const result = await db.addWin(user_id, amount, game_id);
  res.json({
    success: true,
    main_balance: result.mainBalance,
    play_balance: result.playBalance
  });
});

app.post('/api/game_played', async (req, res) => {
  const { user_id, game_id, cards, stake } = req.body;
  if (!user_id || !game_id) return res.status(400).json({ error: 'Missing parameters' });
  await db.recordGamePlayed(user_id, game_id, cards ? cards.length : 1, stake || 10);
  res.json({ success: true });
});

app.get('/api/game_state', async (req, res) => {
  const { user_id, room } = req.query;
  let targetRoom = null;

  if (user_id) {
    for (const rObj of Object.values(rooms)) {
      if (rObj.players && rObj.players[user_id]) {
        targetRoom = rObj;
        break;
      }
    }
  }

  if (!targetRoom) {
    const rId = room || 'stake_10';
    targetRoom = getGameRoom(rId);
  }

  const summary = getRoomGameSummary(targetRoom);
  let myCards = [];
  if (user_id && targetRoom.players[user_id]) {
    myCards = targetRoom.players[user_id].cardNumbers || [];
  }

  res.json({
    room: targetRoom.roomId,
    stake: targetRoom.stake,
    game_running: targetRoom.status === 'running' || targetRoom.status === 'celebrating',
    game_id: targetRoom.gameId,
    time_left: targetRoom.timeLeft,
    status: targetRoom.status,
    called_numbers: targetRoom.calledNumbers,
    total_players: summary.total_players,
    total_cards: summary.total_cards,
    total_pot: summary.total_pot,
    total_prize: summary.total_prize,
    active_cards: summary.active_cards,
    my_cards: myCards
  });
});

app.get('/api/game_history', async (req, res) => {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ error: 'User ID is required' });
  const history = await db.getGameHistory(user_id);
  res.json({ history });
});

app.get('/api/top_winners', async (req, res) => {
  const { period, category } = req.query;
  const winners = await db.getTopWinners(period || 'week', category || 'wins');
  res.json({ winners });
});

app.get('/api/my_rank', async (req, res) => {
  const { user_id, period, category } = req.query;
  if (!user_id) return res.status(400).json({ error: 'User ID is required' });
  const rank = await db.getMyRank(user_id, period || 'week', category || 'wins');
  res.json(rank);
});

app.get('/api/transactions', async (req, res) => {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ error: 'User ID is required' });
  const transactions = await db.getTransactions(user_id);
  res.json({ transactions });
});

app.get('/api/profile_stats', async (req, res) => {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ error: 'User ID is required' });
  const stats = await db.getProfileStats(user_id);
  res.json(stats);
});

// Setup HTTP server and Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Multi-Room Game State Management
const rooms = {};

function createGameObject(roomId, stake) {
  const roomObj = {
    roomId: roomId,
    stake: Number(stake) || 10,
    status: 'waiting', // 'waiting', 'running', 'celebrating'
    timeLeft: 60, // 60-second lobby countdown
    gameId: generateGameId(),
    calledNumbers: [],
    players: {}, // userId -> { userId, name, cards, cardNumbers, stake }
    winners: [],
    timer: null,
    maxWinners: 1,
    ballTimer: null,
    totalPot: 0,
    streaksUpdated: false,
    selectedCartelas: {} // cartela_num -> userId mapping for real-time lobby synchronization
  };
  startGameCountdown(roomObj);
  return roomObj;
}

function getGameRoom(roomId, stakeHint = 10) {
  const rId = roomId || 'stake_10';
  if (!rooms[rId]) {
    let s = stakeHint;
    if (rId.startsWith('stake_')) {
      const parsed = parseInt(rId.replace('stake_', ''), 10);
      if (!isNaN(parsed) && parsed > 0) s = parsed;
    }
    rooms[rId] = createGameObject(rId, s);
  }
  return rooms[rId];
}

// Pre-initialize Silver & VIP Gold rooms
getGameRoom('stake_10', 10);
getGameRoom('stake_20', 20);

function getRoomGameSummary(game) {
  const playersList = Object.values(game.players || {});
  let totalCardsCount = 0;
  let totalPot = 0;
  const activeCards = [];

  playersList.forEach(p => {
    const cardNums = p.cardNumbers || [];
    totalCardsCount += cardNums.length;
    totalPot += cardNums.length * (Number(p.stake) || game.stake);
    cardNums.forEach(cNum => {
      activeCards.push({
        cardNum: cNum,
        userId: p.userId,
        name: p.name || 'Player'
      });
    });
  });

  game.totalPot = totalPot;
  const totalPrize = Math.round(totalPot * 0.8);

  return {
    total_players: playersList.length,
    total_cards: totalCardsCount,
    total_pot: totalPot,
    total_prize: totalPrize,
    active_cards: activeCards
  };
}

function startGameCountdown(game) {
  if (game.timer) clearInterval(game.timer);
  game.timer = setInterval(() => {
    if (game.status !== 'waiting') return;
    game.timeLeft--;

    io.to(game.roomId).emit('countdown_update', {
      room: game.roomId,
      game_id: game.gameId,
      time_left: game.timeLeft,
      status: game.status
    });

    if (game.timeLeft <= 0) {
      tryStartGame(game);
    }
  }, 1000);
}

async function tryStartGame(game) {
  const summary = getRoomGameSummary(game);
  let minPlayers = 1;
  try {
    const sysSettings = await db.getSystemSettings();
    if (sysSettings && sysSettings.min_players) {
      minPlayers = parseInt(sysSettings.min_players, 10) || 1;
    }
  } catch(e) {}

  if (summary.total_players >= minPlayers && summary.total_cards >= 1) {
    clearInterval(game.timer);
    game.timer = null;
    game.status = 'running';
    game.calledNumbers = [];
    game.winners = [];
    game.selectedCartelas = {};

    io.to(game.roomId).emit('game_started', {
      room: game.roomId,
      game_id: game.gameId,
      total_players: summary.total_players,
      total_cards: summary.total_cards,
      total_pot: summary.total_pot,
      total_prize: summary.total_prize,
      active_cards: summary.active_cards
    });

    io.to(game.roomId).emit('cartelas_update', {
      room: game.roomId,
      selectedCartelas: game.selectedCartelas
    });

    startBallDrawing(game);
  } else {
    // No player joined, reset timer for next countdown
    game.timeLeft = 60;
    game.gameId = generateGameId();
    io.to(game.roomId).emit('countdown_update', {
      room: game.roomId,
      game_id: game.gameId,
      time_left: game.timeLeft,
      status: game.status
    });
  }
}

function startBallDrawing(game) {
  if (game.ballTimer) clearInterval(game.ballTimer);

  const pool = [];
  for (let i = 1; i <= 75; i++) pool.push(i);

  // Random shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  let index = 0;

  function drawBall() {
    if (index >= 75 || game.status !== 'running') {
      clearInterval(game.ballTimer);
      game.ballTimer = null;
      endGame(game);
      return;
    }

    const num = pool[index++];
    game.calledNumbers.push(num);

    let letter = 'B';
    if (num >= 16 && num <= 30) letter = 'I';
    else if (num >= 31 && num <= 45) letter = 'N';
    else if (num >= 46 && num <= 60) letter = 'G';
    else if (num >= 61 && num <= 75) letter = 'O';

    io.to(game.roomId).emit('ball_called', {
      room: game.roomId,
      number: num,
      letter: letter,
      calledNumbers: game.calledNumbers
    });

    // Automatic Server-Side Bingo Win Verification
    const calledSet = new Set(game.calledNumbers);
    let autoWinner = null;
    for (const [userId, player] of Object.entries(game.players || {})) {
      if (!player.cards) continue;
      for (let ci = 0; ci < player.cards.length; ci++) {
        const card = player.cards[ci];
        const cardNum = (player.cardNumbers && player.cardNumbers[ci]) ? player.cardNumbers[ci] : (ci + 1);
        if (verifyWin(card, calledSet)) {
          autoWinner = {
            userId: userId,
            name: player.name || 'Player',
            cardNum: cardNum,
            cardIndex: ci
          };
          break;
        }
      }
      if (autoWinner) break;
    }

    if (autoWinner) {
      if (game.ballTimer) {
        clearInterval(game.ballTimer);
        game.ballTimer = null;
      }
      game.winners = [autoWinner];
      game.status = 'celebrating';

      const summary = getRoomGameSummary(game);
      const totalPrize = summary.total_prize || Math.round(game.totalPot * 0.8);

      // Award win in database
      db.addWin(autoWinner.userId, totalPrize, game.gameId);

      io.to(game.roomId).emit('game_ended', {
        room: game.roomId,
        game_id: game.gameId,
        winners: game.winners,
        total_players: summary.total_players,
        total_cards: summary.total_cards,
        total_pot: summary.total_pot,
        total_prize: totalPrize,
        active_cards: summary.active_cards
      });

      if (!game.streaksUpdated) {
        updateStreaksOnGameEnd(game.players, game.winners);
        game.streaksUpdated = true;
      }

      const winnerIds = (game.winners || []).map(w => w.userId);
      const prizeEach = winnerIds.length > 0 ? Math.round(totalPrize / winnerIds.length) : totalPrize;
      db.completeGameHistory(game.gameId, winnerIds, prizeEach);

      setTimeout(() => {
        endGame(game);
      }, 5000);
      return;
    }
  }

  // Draw first ball immediately
  if (game.status === 'running') {
    drawBall();
  }

  game.ballTimer = setInterval(() => {
    if (game.status !== 'running') {
      clearInterval(game.ballTimer);
      game.ballTimer = null;
      return;
    }
    drawBall();
  }, 3200);
}

async function updateStreaksOnGameEnd(players, winners) {
  try {
    const playerIds = Object.keys(players || {});
    if (playerIds.length === 0) return;
    const winnerIds = new Set((winners || []).map(w => w.userId));
    for (const pId of playerIds) {
      const won = winnerIds.has(pId);
      await db.updateUserStreak(pId, won);
    }
  } catch (err) {
    console.error('Error updating streaks on game end:', err);
  }
}

function endGame(game) {
  if (game.ballTimer) clearInterval(game.ballTimer);
  game.ballTimer = null;

  if (!game.streaksUpdated) {
    updateStreaksOnGameEnd(game.players, game.winners);
    game.streaksUpdated = true;
  }

  game.status = 'waiting';
  game.timeLeft = 60;
  game.gameId = generateGameId();
  game.players = {};
  game.calledNumbers = [];
  game.winners = [];
  game.streaksUpdated = false;
  game.totalPot = 0;
  game.selectedCartelas = {};

  io.to(game.roomId).emit('round_reset', {
    room: game.roomId,
    game_id: game.gameId,
    time_left: game.timeLeft
  });

  io.to(game.roomId).emit('cartelas_update', {
    room: game.roomId,
    selectedCartelas: game.selectedCartelas
  });

  startGameCountdown(game);
}

// Socket.io Realtime Events
io.on('connection', (socket) => {
  socket.on('join_room', (data) => {
    const reqRoom = (data && data.room) ? data.room : 'stake_10';
    const stake = (data && data.stake) ? data.stake : 10;
    const game = getGameRoom(reqRoom, stake);

    if (socket.currentRoom && socket.currentRoom !== game.roomId) {
      socket.leave(socket.currentRoom);
    }

    socket.currentRoom = game.roomId;
    socket.join(game.roomId);

    if (data && data.user_id) {
      socket.userId = data.user_id;
    }

    const summary = getRoomGameSummary(game);

    socket.emit('countdown_update', {
      room: game.roomId,
      game_id: game.gameId,
      time_left: game.timeLeft,
      status: game.status
    });

    socket.emit('game_state_update', {
      room: game.roomId,
      stake: game.stake,
      game_id: game.gameId,
      status: game.status,
      time_left: game.timeLeft,
      called_numbers: game.calledNumbers,
      total_players: summary.total_players,
      total_cards: summary.total_cards,
      total_pot: summary.total_pot,
      total_prize: summary.total_prize,
      active_cards: summary.active_cards,
      my_cards: (socket.userId && game.players[socket.userId]) ? game.players[socket.userId].cardNumbers : []
    });

    socket.emit('cartelas_update', {
      room: game.roomId,
      selectedCartelas: game.selectedCartelas || {}
    });
  });

  socket.on('leave_room', (data) => {
    const reqRoom = (data && data.room) || socket.currentRoom || 'stake_10';
    const game = getGameRoom(reqRoom);
    socket.leave(game.roomId);

    if (socket.userId && game.status === 'waiting') {
      delete game.players[socket.userId];
      if (game.selectedCartelas) {
        for (const [cartela, uId] of Object.entries(game.selectedCartelas)) {
          if (uId === socket.userId) {
            delete game.selectedCartelas[cartela];
          }
        }
      }
      const summary = getRoomGameSummary(game);
      io.to(game.roomId).emit('player_joined', {
        room: game.roomId,
        total_players: summary.total_players,
        total_cards: summary.total_cards,
        total_pot: summary.total_pot,
        total_prize: summary.total_prize,
        active_cards: summary.active_cards
      });
      io.to(game.roomId).emit('cartelas_update', {
        room: game.roomId,
        selectedCartelas: game.selectedCartelas
      });
    }
    socket.currentRoom = null;
  });

  socket.on('request_countdown', (data) => {
    const reqRoom = (data && data.room) || socket.currentRoom || 'stake_10';
    const game = getGameRoom(reqRoom);
    socket.emit('countdown_update', {
      room: game.roomId,
      game_id: game.gameId,
      time_left: game.timeLeft,
      status: game.status
    });
  });

  socket.on('toggle_cartela', (data) => {
    const { user_id, cartela_num, selected, room } = data;
    const reqRoom = room || socket.currentRoom || 'stake_10';
    const game = getGameRoom(reqRoom);

    if (game.status !== 'waiting') return;
    if (!game.selectedCartelas) game.selectedCartelas = {};

    if (selected) {
      if (game.selectedCartelas[cartela_num] && game.selectedCartelas[cartela_num] !== user_id) {
        socket.emit('cartelas_update', { room: game.roomId, selectedCartelas: game.selectedCartelas });
        return;
      }
      game.selectedCartelas[cartela_num] = user_id;
    } else {
      if (game.selectedCartelas[cartela_num] === user_id) {
        delete game.selectedCartelas[cartela_num];
      }
    }

    io.to(game.roomId).emit('cartelas_update', {
      room: game.roomId,
      selectedCartelas: game.selectedCartelas
    });
  });

  socket.on('player_ready', (data) => {
    const { user_id, name, cards, game_id, room, stake } = data;
    const reqRoom = room || socket.currentRoom || 'stake_10';
    const game = getGameRoom(reqRoom, stake);

    if (game.status !== 'waiting') return;
    socket.userId = user_id;

    if (!cards || cards.length === 0) {
      delete game.players[user_id];
    } else {
      const cardGrids = cards.map(cId => generateCardDeterministic(cId));
      game.players[user_id] = {
        userId: user_id,
        name: name || 'Player',
        cards: cardGrids,
        cardNumbers: cards,
        stake: Number(stake) || game.stake
      };
    }

    const summary = getRoomGameSummary(game);

    io.to(game.roomId).emit('player_joined', {
      room: game.roomId,
      total_players: summary.total_players,
      total_cards: summary.total_cards,
      total_pot: summary.total_pot,
      total_prize: summary.total_prize,
      active_cards: summary.active_cards
    });

    io.to(game.roomId).emit('game_state_update', {
      room: game.roomId,
      stake: game.stake,
      game_id: game.gameId,
      status: game.status,
      time_left: game.timeLeft,
      called_numbers: game.calledNumbers,
      total_players: summary.total_players,
      total_cards: summary.total_cards,
      total_pot: summary.total_pot,
      total_prize: summary.total_prize,
      active_cards: summary.active_cards
    });
  });

  socket.on('start_match_now', (data) => {
    const reqRoom = (data && data.room) || socket.currentRoom || 'stake_10';
    const game = getGameRoom(reqRoom);
    if (game.status === 'waiting') {
      game.timeLeft = 1;
      io.to(game.roomId).emit('countdown_update', {
        room: game.roomId,
        game_id: game.gameId,
        time_left: 1,
        status: 'waiting'
      });
    }
  });

  socket.on('declare_winner', async (data) => {
    const { user_id, name, card_num, card_index, game_id, room } = data;
    const reqRoom = room || socket.currentRoom || 'stake_10';
    const game = getGameRoom(reqRoom);

    if (game.status !== 'running' || game.gameId !== game_id) return;
    const player = game.players[user_id];
    if (!player) return;

    const card = player.cards[card_index];
    if (!card) return;

    if (game.winners.some(w => w.userId === user_id && w.cardNum === card_num)) return;

    const calledSet = new Set(game.calledNumbers);
    const isValidWin = verifyWin(card, calledSet);

    if (isValidWin) {
      game.winners.push({
        userId: user_id,
        name: player.name,
        cardNum: card_num,
        cardIndex: card_index
      });

      if (game.ballTimer) {
        clearInterval(game.ballTimer);
        game.ballTimer = null;
      }

      game.status = 'celebrating';

      const summary = getRoomGameSummary(game);
      const totalPrize = summary.total_prize || Math.round(game.totalPot * 0.8);

      // Add win to database
      await db.addWin(user_id, totalPrize, game.gameId);

      io.to(game.roomId).emit('game_ended', {
        room: game.roomId,
        game_id: game.gameId,
        winners: game.winners,
        total_players: summary.total_players,
        total_cards: summary.total_cards,
        total_pot: summary.total_pot,
        total_prize: totalPrize,
        active_cards: summary.active_cards
      });

      if (!game.streaksUpdated) {
        updateStreaksOnGameEnd(game.players, game.winners);
        game.streaksUpdated = true;
      }

      const winnerIds = (game.winners || []).map(w => w.userId);
      const prizeEach = winnerIds.length > 0 ? Math.round(totalPrize / winnerIds.length) : totalPrize;
      db.completeGameHistory(game.gameId, winnerIds, prizeEach);

      setTimeout(() => {
        endGame(game);
      }, 5000);
    }
  });

  socket.on('disconnect', () => {
    if (socket.userId && socket.currentRoom) {
      const game = rooms[socket.currentRoom];
      if (game && game.status === 'waiting') {
        delete game.players[socket.userId];
        if (game.selectedCartelas) {
          for (const [cartela, uId] of Object.entries(game.selectedCartelas)) {
            if (uId === socket.userId) {
              delete game.selectedCartelas[cartela];
            }
          }
        }
        const summary = getRoomGameSummary(game);
        io.to(game.roomId).emit('player_joined', {
          room: game.roomId,
          total_players: summary.total_players,
          total_cards: summary.total_cards,
          total_pot: summary.total_pot,
          total_prize: summary.total_prize,
          active_cards: summary.active_cards
        });
        io.to(game.roomId).emit('cartelas_update', {
          room: game.roomId,
          selectedCartelas: game.selectedCartelas
        });
      }
    }
  });
});

const telegramBot = require('./telegram_bot');

server.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(` YERASE BINGO SERVER RUNNING ON PORT ${PORT}`);
  console.log(` Multi-Room Live Multiplayer & REST API Active`);
  console.log(` http://localhost:${PORT}/`);
  console.log(`====================================================`);

  // Start Telegram Bot listener
  try {
    telegramBot.startBot();
  } catch (err) {
    console.error('Failed to start Telegram Bot:', err.message);
  }
});
