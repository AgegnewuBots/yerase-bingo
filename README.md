# 🇪🇹 Yerase Bingo (የራሴ ቢንጎ) - Silver Edition

> **"የኢትዮጵያ ቀዳሚው ዘመናዊ የቀጥታ ቢንጎ • Ethiopia's Premier Live Multiplayer Bingo"**

**Yerase Bingo (የራሴ ቢንጎ) - Silver Edition** is an advanced, fully functional, real-time multiplayer iGaming platform built on Node.js, Express, Socket.io, and a persistent ACID JSON/file database. **All fake mocks and simulated timers have been removed** in favor of authentic server-synchronized rooms, live player reservations, authentic Ethiopian Amharic voice calls, and real financial ledger tracking.

---

## 💎 Real Architecture & Real Data Systems

### 1. Real Server & Multi-Room State (`server.js`)
- **Node.js + Express + Socket.io running on `http://localhost:3000/`**.
- **Real Multi-Room Synchronization**:
  - **10 ETB Silver Room (`stake_10`)**: 10 Birr entry, live player counts, real-time pot calculation (`total_cards * stake * 0.8`).
  - **20 ETB VIP Gold Room (`stake_20`)**: 20 Birr entry, live player counts, real-time pot calculation.
- **Server-Driven Game Loop**:
  - Live 30-second lobby countdown broadcast to all connected players via `countdown_update`.
  - When countdown ends, server draws random balls (1-75) without duplicates every 3.2s and emits `ball_called` with `{ letter, number }`.
  - Server verifies BINGO patterns via `verifyWin(card, calledNumbersSet)`.
  - Upon win, server pays out the real prize, updates the user's balance, records streaks, emits `game_ended`, and triggers the next round with `round_reset`.
- **Real-Time Cartela Reservation**:
  - When Player 1 selects Cartela #45, `cartelas_update` immediately locks Cartela #45 for Player 2 across all browsers and devices in real-time.

### 2. Real Persistent Database (`database.js` & `data/bingo_database.json`)
- **No In-Memory Data Loss**: Automatically flushes all records to `data/bingo_database.json`.
- **Real Collections**:
  - **`users`**: Account info, user ID, phone, password, `main_balance`, `play_balance`, `games_played`, `games_won`, `total_won`, streaks.
  - **`transactions`**: Complete ledger tracking all deposits, withdrawals, bets, and wins.
  - **`game_history`**: History of played rounds, card counts, and stakes.
  - **`system_settings`**: Maintenance flags, withdrawal limits, bot links.

### 3. Real Financial Wallet & Modals
- **Real Deposit (`POST /api/client/deposit`)**:
  - Supports **Telebirr (ቴሌብር)** and **CBE Birr (ንግድ ባንክ)**.
  - Instant credit with transaction recording in `data/bingo_database.json`.
- **Real Withdrawal (`POST /api/client/withdraw`)**:
  - Validates minimum amount (150 ETB), verifies available balance, deducts funds, and creates completed ledger entry.
- **Real Balances (`GET /api/balance`)**: Live API query returning the player's true wallet balances.
- **Real Transaction History (`GET /api/transactions`)**: Returns authentic ledger records.

### 4. Real Leaderboard & Stats
- **`GET /api/top_winners`**: Computes rankings from real database records (Wins, Games Played, Total Won, Balance).
- **`GET /api/profile_stats`**: Returns real player stats.

---

## 🌟 Interactive Features & Chrome Experience

- **Expansive Chrome Desktop Layout (`max-width: 1060px`)**: Full-width luxury silver casino interface on desktop, tablet, and mobile.
- **400-Card Matrix**:
  - Real-time card picker with number search (`Card # (1-400)`).
  - Quick Pick: `[⚡ 1 Card]`, `[🎲 2 Cards]`, `[🗑️ Clear]`.
  - `[🚀 START NOW]`: Emits `start_match_now` to immediately launch round.
- **Live Match Arena**:
  - Left column: 3D Calling Ball with Amharic pronunciation label, Recent 5 balls ticker, Master 75-Ball Board, Sound toggle, Auto/Manual daub switch.
  - Right column: Large 5x5 user cartelas with tactile click daubing and pulsing **CLAIM BINGO! (የራሴ ቢንጎ!)** victory button.
- **Authentic Amharic Sound Engine**:
  - Direct Ethiopian voice caller recordings: `https://bingo-server-1.onrender.com/sounds/{L}-{n}.mp3` (`b-1.mp3` through `o-75.mp3`) and `bingo.mp3`.
  - Chrome Autoplay Audio Unlocker primes audio on first user touch/click.
- **Admin Panel**:
  - Accessible at `http://localhost:3000/admin` with password `@YERASE1009`.

---

## 🚀 How to Run

1. **Start the Real Multiplayer Server**:
   ```bash
   node server.js
   ```
   Server will start at: **`http://localhost:3000/`**

2. **Open in Browser**:
   - Primary player: `http://localhost:3000/`
   - Secondary player: Open another tab or an incognito window at `http://localhost:3000/` to test real multiplayer card locking and live competition!

3. **Launch Telegram Mini App Bot**:
   ```bash
   python telegram_bot.py
   ```
