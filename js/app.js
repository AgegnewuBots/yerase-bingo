/**
 * Yerase Bingo (የራሴ ቢንጎ) - Main Application Controller
 * Orchestrates UI views, 75-ball engine, 400-player multiplayer, wallet, audio, and Telegram SDK.
 */

import { translations } from './translations.js';
import { audio } from './audio.js';
import { wallet } from './wallet.js';
import { generateCartela, BINGO_LETTERS, LETTER_RANGES } from './bingo-engine.js';
import { RoomSession } from './multiplayer.js';
import { telegram } from './telegram.js';

class AppController {
  constructor() {
    this.currentLang = 'am'; // Default Amharic
    this.activeRoomSession = null;
    this.selectedCartelaCount = 2;
    this.pendingRoomType = '10';
    this.autoDaubEnabled = true;

    // Cache DOM Elements
    this.dom = {};
  }

  init() {
    this.cacheDOMElements();
    this.buildMasterBoard();
    this.setupEventListeners();
    this.initWalletSync();
    this.applyLanguage(this.currentLang);

    // Audio unlock on initial user tap
    const unlockAudio = () => {
      audio.ensureContext();
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
    document.addEventListener('click', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);

    console.log("🇪🇹 Yerase Bingo (የራሴ ቢንጎ) initialized successfully!");
  }

  cacheDOMElements() {
    this.dom = {
      // Views
      viewLobby: document.getElementById('viewLobby'),
      viewGame: document.getElementById('viewGame'),
      brandNav: document.getElementById('brandNav'),

      // Header
      userBalanceDisplay: document.getElementById('userBalanceDisplay'),
      walletTrigger: document.getElementById('walletTrigger'),
      btnOpenDeposit: document.getElementById('btnOpenDeposit'),
      langSwitchBtn: document.getElementById('langSwitchBtn'),
      langCurrentLabel: document.getElementById('langCurrentLabel'),
      btnToggleSound: document.getElementById('btnToggleSound'),
      btnToggleVoice: document.getElementById('btnToggleVoice'),
      btnToggleTelegramMode: document.getElementById('btnToggleTelegramMode'),
      closeSimBtn: document.getElementById('closeSimBtn'),

      // Lobby Rooms
      btnEnterRoom10: document.getElementById('btnEnterRoom10'),
      btnEnterRoom20: document.getElementById('btnEnterRoom20'),
      room10Pot: document.getElementById('room10Pot'),
      room20Pot: document.getElementById('room20Pot'),
      room10Players: document.getElementById('room10Players'),
      room20Players: document.getElementById('room20Players'),

      // Game Sub Bar
      btnBackToLobby: document.getElementById('btnBackToLobby'),
      activeRoomTitle: document.getElementById('activeRoomTitle'),
      activeRoomPriceBadge: document.getElementById('activeRoomPriceBadge'),
      metricRoundVal: document.getElementById('metricRoundVal'),
      metricPlayersVal: document.getElementById('metricPlayersVal'),
      metricPotVal: document.getElementById('metricPotVal'),

      // Caller & Master Board
      phaseBadge: document.getElementById('phaseBadge'),
      activeBallArea: document.getElementById('activeBallArea'),
      buyingCountdownBox: document.getElementById('buyingCountdownBox'),
      countdownSeconds: document.getElementById('countdownSeconds'),
      bingoBallVisual: document.getElementById('bingoBallVisual'),
      ballLetter: document.getElementById('ballLetter'),
      ballNumber: document.getElementById('ballNumber'),
      recentBallsTrack: document.getElementById('recentBallsTrack'),
      calledBallsCount: document.getElementById('calledBallsCount'),
      boardCallCount: document.getElementById('boardCallCount'),
      boardRows: {
        B: document.getElementById('boardRowB'),
        I: document.getElementById('boardRowI'),
        N: document.getElementById('boardRowN'),
        G: document.getElementById('boardRowG'),
        O: document.getElementById('boardRowO')
      },

      // Cartelas & Action Bar
      btnToggleAutoDaub: document.getElementById('btnToggleAutoDaub'),
      lblAutoDaub: document.getElementById('lblAutoDaub'),
      btnBuyMoreCartela: document.getElementById('btnBuyMoreCartela'),
      cartelasDeckGrid: document.getElementById('cartelasDeckGrid'),
      btnClaimBingo: document.getElementById('btnClaimBingo'),

      // Live Chat
      chatStreamBox: document.getElementById('chatStreamBox'),
      chatForm: document.getElementById('chatForm'),
      chatInput: document.getElementById('chatInput'),

      // Demo Speed Controls
      speedNormal: document.getElementById('speedNormal'),
      speedTurbo: document.getElementById('speedTurbo'),
      speedInstant: document.getElementById('speedInstant'),

      // Modals
      walletModal: document.getElementById('walletModal'),
      btnCloseWalletModal: document.getElementById('btnCloseWalletModal'),
      btnConfirmDeposit: document.getElementById('btnConfirmDeposit'),
      depositAmountInput: document.getElementById('depositAmountInput'),

      cartelaModal: document.getElementById('cartelaModal'),
      btnCloseCartelaModal: document.getElementById('btnCloseCartelaModal'),
      btnConfirmBuyCartela: document.getElementById('btnConfirmBuyCartela'),
      modalRoomPrice: document.getElementById('modalRoomPrice'),
      modalTotalStake: document.getElementById('modalTotalStake'),

      winnerModal: document.getElementById('winnerModal'),
      btnCloseWinnerModal: document.getElementById('btnCloseWinnerModal'),
      winnerModalAmount: document.getElementById('winnerModalAmount'),
      winnerModalName: document.getElementById('winnerModalName'),
      winnerModalPattern: document.getElementById('winnerModalPattern')
    };
  }

  buildMasterBoard() {
    // Generate numbers 1 to 75 in B, I, N, G, O rows
    for (let i = 1; i <= 75; i++) {
      let rowKey = 'B';
      if (i > 15 && i <= 30) rowKey = 'I';
      else if (i > 30 && i <= 45) rowKey = 'N';
      else if (i > 45 && i <= 60) rowKey = 'G';
      else if (i > 60) rowKey = 'O';

      const cell = document.createElement('div');
      cell.className = 'board-cell';
      cell.id = `boardCell-${i}`;
      cell.textContent = i;
      this.dom.boardRows[rowKey].appendChild(cell);
    }
  }

  setupEventListeners() {
    // Navigation
    this.dom.brandNav.addEventListener('click', () => this.showLobby());
    this.dom.btnBackToLobby.addEventListener('click', () => this.showLobby());

    // Enter Rooms
    this.dom.btnEnterRoom10.addEventListener('click', () => this.enterRoom('10'));
    this.dom.btnEnterRoom20.addEventListener('click', () => this.enterRoom('20'));

    // Language Toggle
    this.dom.langSwitchBtn.addEventListener('click', () => {
      this.currentLang = this.currentLang === 'am' ? 'en' : 'am';
      this.applyLanguage(this.currentLang);
    });

    // Sound & Voice Toggles
    this.dom.btnToggleSound.addEventListener('click', () => {
      const active = audio.toggleSound();
      this.dom.btnToggleSound.classList.toggle('active', active);
      this.dom.btnToggleSound.textContent = active ? '🔊' : '🔇';
    });

    this.dom.btnToggleVoice.addEventListener('click', () => {
      const active = audio.toggleVoice();
      this.dom.btnToggleVoice.classList.toggle('active', active);
      this.dom.btnToggleVoice.textContent = active ? '🗣️' : '🤐';
    });

    // Telegram Mode Simulator Toggle
    this.dom.btnToggleTelegramMode.addEventListener('click', () => {
      telegram.toggleSimulator();
    });
    this.dom.closeSimBtn.addEventListener('click', () => {
      telegram.toggleSimulator(false);
    });

    // Auto Daub Toggle
    this.dom.btnToggleAutoDaub.addEventListener('click', () => {
      this.autoDaubEnabled = !this.autoDaubEnabled;
      if (this.activeRoomSession) {
        this.activeRoomSession.autoDaub = this.autoDaubEnabled;
      }
      this.dom.btnToggleAutoDaub.classList.toggle('active', this.autoDaubEnabled);
      const t = translations[this.currentLang];
      this.dom.lblAutoDaub.textContent = this.autoDaubEnabled ? 
        `⚡ ${t.autoDaub}: ON` : `✋ ${t.manualDaub}: ON`;
    });

    // Buy More Cartelas Trigger
    this.dom.btnBuyMoreCartela.addEventListener('click', () => {
      this.openCartelaModal();
    });

    // Cartela Count Buttons in Modal
    [1, 2, 3, 4].forEach(count => {
      const btn = document.getElementById(`btnCount${count}`);
      if (btn) {
        btn.addEventListener('click', () => {
          document.querySelectorAll('#cartelaModal .amount-chip').forEach(c => c.classList.remove('active'));
          btn.classList.add('active');
          this.selectedCartelaCount = count;
          this.updateCartelaModalPrice();
        });
      }
    });

    this.dom.btnConfirmBuyCartela.addEventListener('click', () => {
      this.confirmBuyCartelas();
    });

    this.dom.btnCloseCartelaModal.addEventListener('click', () => {
      this.dom.cartelaModal.style.display = 'none';
    });

    // Deposit Modal Events
    this.dom.btnOpenDeposit.addEventListener('click', () => this.openDepositModal());
    this.dom.walletTrigger.addEventListener('click', () => this.openDepositModal());
    this.dom.btnCloseWalletModal.addEventListener('click', () => {
      this.dom.walletModal.style.display = 'none';
    });

    // Payment Method Selection
    document.querySelectorAll('.payment-method-tile').forEach(tile => {
      tile.addEventListener('click', () => {
        document.querySelectorAll('.payment-method-tile').forEach(t => t.classList.remove('selected'));
        tile.classList.add('selected');
      });
    });

    // Quick Amount Chips
    document.querySelectorAll('.quick-amount-chips .amount-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.quick-amount-chips .amount-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.dom.depositAmountInput.value = chip.dataset.amount;
      });
    });

    this.dom.btnConfirmDeposit.addEventListener('click', () => {
      const amount = parseFloat(this.dom.depositAmountInput.value) || 0;
      const selectedMethodTile = document.querySelector('.payment-method-tile.selected');
      const method = selectedMethodTile ? selectedMethodTile.dataset.method : 'Telebirr';
      if (amount > 0) {
        wallet.deposit(amount, method);
        this.dom.walletModal.style.display = 'none';
      }
    });

    // Winner Modal Close
    this.dom.btnCloseWinnerModal.addEventListener('click', () => {
      this.dom.winnerModal.style.display = 'none';
    });

    // Claim BINGO Button
    this.dom.btnClaimBingo.addEventListener('click', () => {
      this.handleUserClaimBingo();
    });

    // Chat Form Submit
    this.dom.chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = this.dom.chatInput.value.trim();
      if (text && this.activeRoomSession) {
        const user = telegram.getUser();
        this.activeRoomSession.addChatMessage(user.name, text);
        this.dom.chatInput.value = '';
      }
    });

    // Speed Controls
    const setSpeed = (ms, activeBtn) => {
      [this.dom.speedNormal, this.dom.speedTurbo, this.dom.speedInstant].forEach(b => b.classList.remove('active'));
      activeBtn.classList.add('active');
      if (this.activeRoomSession) {
        this.activeRoomSession.setDrawSpeed(ms);
      }
    };
    this.dom.speedNormal.addEventListener('click', () => setSpeed(3200, this.dom.speedNormal));
    this.dom.speedTurbo.addEventListener('click', () => setSpeed(1500, this.dom.speedTurbo));
    this.dom.speedInstant.addEventListener('click', () => setSpeed(800, this.dom.speedInstant));
  }

  initWalletSync() {
    wallet.subscribe((bal) => {
      this.dom.userBalanceDisplay.textContent = bal.toFixed(2);
    });
  }

  showLobby() {
    if (this.activeRoomSession) {
      this.activeRoomSession.stop();
      this.activeRoomSession = null;
    }
    this.dom.viewGame.style.display = 'none';
    this.dom.viewLobby.style.display = 'flex';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  enterRoom(roomType) {
    this.pendingRoomType = roomType;
    const pricePerCartela = roomType === '20' ? 20 : 10;
    const requiredMin = pricePerCartela;

    if (!wallet.canAfford(requiredMin)) {
      this.openDepositModal();
      return;
    }

    this.dom.viewLobby.style.display = 'none';
    this.dom.viewGame.style.display = 'flex';
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Room session setup
    if (this.activeRoomSession) this.activeRoomSession.stop();

    this.activeRoomSession = new RoomSession(
      roomType,
      (state) => this.renderGameState(state),
      (chat) => this.renderChatStream(chat)
    );

    // Initial buy: give 2 cartelas (or 1 if balance only covers 1)
    const canAfford2 = wallet.canAfford(pricePerCartela * 2);
    const initialCount = canAfford2 ? 2 : 1;
    wallet.deduct(pricePerCartela * initialCount, `${pricePerCartela} ETB Bingo Room Tickets`);

    this.activeRoomSession.userCartelas = [];
    for (let i = 0; i < initialCount; i++) {
      this.activeRoomSession.userCartelas.push(generateCartela(1 + i * 15));
    }

    this.activeRoomSession.autoDaub = this.autoDaubEnabled;
    this.activeRoomSession.start();

    // Update Room Header
    const t = translations[this.currentLang];
    this.dom.activeRoomTitle.textContent = roomType === '20' ? t.roomGoldTitle : t.roomSilverTitle;
    this.dom.activeRoomPriceBadge.textContent = `${pricePerCartela} ETB / Cartela`;

    this.resetMasterBoardVisuals();
  }

  openCartelaModal() {
    if (!this.activeRoomSession) return;
    this.updateCartelaModalPrice();
    this.dom.cartelaModal.style.display = 'flex';
  }

  updateCartelaModalPrice() {
    const pricePerCartela = this.activeRoomSession?.pricePerCartela || (this.pendingRoomType === '20' ? 20 : 10);
    const total = this.selectedCartelaCount * pricePerCartela;
    this.dom.modalRoomPrice.textContent = `${pricePerCartela} ETB`;
    this.dom.modalTotalStake.textContent = `${total} ETB`;
  }

  confirmBuyCartelas() {
    if (!this.activeRoomSession) return;
    const price = this.activeRoomSession.pricePerCartela * this.selectedCartelaCount;

    if (!wallet.canAfford(price)) {
      this.dom.cartelaModal.style.display = 'none';
      this.openDepositModal();
      return;
    }

    wallet.deduct(price, `Bought ${this.selectedCartelaCount} Cartelas`);
    this.activeRoomSession.userCartelas = [];
    for (let i = 0; i < this.selectedCartelaCount; i++) {
      this.activeRoomSession.userCartelas.push(generateCartela(Math.floor(1 + Math.random() * 380)));
    }
    this.activeRoomSession.updatePot();
    this.dom.cartelaModal.style.display = 'none';
    this.renderUserCartelas(this.activeRoomSession.userCartelas);
  }

  openDepositModal() {
    this.dom.walletModal.style.display = 'flex';
  }

  resetMasterBoardVisuals() {
    for (let i = 1; i <= 75; i++) {
      const cell = document.getElementById(`boardCell-${i}`);
      if (cell) cell.classList.remove('called');
    }
    this.dom.recentBallsTrack.innerHTML = `<span class="ball-placeholder-text" id="noBallsYet">ጨዋታው ሲጀምር ኳሶች እዚህ ይወጣሉ</span>`;
    this.dom.calledBallsCount.textContent = '0';
    this.dom.boardCallCount.textContent = '0/75';
  }

  renderGameState(state) {
    const t = translations[this.currentLang];

    // Metrics Bar
    this.dom.metricRoundVal.textContent = `#${state.roundNumber}`;
    this.dom.metricPlayersVal.textContent = state.playerCount;
    this.dom.metricPotVal.textContent = `${state.potPool.toLocaleString()} ETB`;

    // Phase Badge & Caller display
    if (state.status === 'BUYING') {
      this.dom.phaseBadge.className = 'caller-phase-badge buying';
      this.dom.phaseBadge.textContent = `${t.roundStartingIn} ${state.buyCountdown}s`;
      this.dom.buyingCountdownBox.style.display = 'flex';
      this.dom.bingoBallVisual.style.display = 'none';
      this.dom.countdownSeconds.textContent = state.buyCountdown;
      this.dom.btnClaimBingo.disabled = true;
    } else if (state.status === 'PLAYING') {
      this.dom.phaseBadge.className = 'caller-phase-badge playing';
      this.dom.phaseBadge.textContent = `${t.gameInProgress} (${state.calledBalls.length}/75)`;
      this.dom.buyingCountdownBox.style.display = 'none';

      if (state.currentBall) {
        this.dom.bingoBallVisual.style.display = 'flex';
        this.dom.ballLetter.textContent = state.currentBall.letter;
        this.dom.ballNumber.textContent = state.currentBall.number;

        // Color ball
        const color = LETTER_RANGES[state.currentBall.letter]?.color || '#FFB800';
        this.dom.bingoBallVisual.style.background = `radial-gradient(circle at 35% 30%, #FFFFFF 0%, ${color} 60%, #000 120%)`;

        // Mark Master Board Cell
        const boardCell = document.getElementById(`boardCell-${state.currentBall.number}`);
        if (boardCell && !boardCell.classList.contains('called')) {
          boardCell.classList.add('called');
        }

        // Update Recent Balls Strip
        this.updateRecentBallsTrack(state.calledBalls);
      }
    } else if (state.status === 'WINNER') {
      this.dom.phaseBadge.className = 'caller-phase-badge winner';
      this.dom.phaseBadge.textContent = t.bingoWinner;
      if (state.winnerInfo) {
        this.showWinnerModal(state.winnerInfo);
      }
    }

    // Check if any user cartela has won
    const hasUserWon = state.userCartelas.some(c => c.hasWon);
    this.dom.btnClaimBingo.disabled = !hasUserWon;

    // Render User Cartelas
    this.renderUserCartelas(state.userCartelas);
  }

  updateRecentBallsTrack(calledBalls) {
    const track = this.dom.recentBallsTrack;
    track.innerHTML = '';
    this.dom.calledBallsCount.textContent = calledBalls.length;
    this.dom.boardCallCount.textContent = `${calledBalls.length}/75`;

    calledBalls.slice(0, 8).forEach(b => {
      const mini = document.createElement('div');
      mini.className = 'mini-ball';
      mini.textContent = `${b.letter}${b.number}`;
      mini.style.borderColor = b.color;
      track.appendChild(mini);
    });
  }

  renderUserCartelas(cartelas) {
    const container = this.dom.cartelasDeckGrid;
    container.innerHTML = '';

    cartelas.forEach(cartela => {
      const card = document.createElement('div');
      card.className = `cartela-card ${cartela.oneToGo ? 'one-to-go' : ''} ${cartela.hasWon ? 'has-won' : ''}`;

      const t = translations[this.currentLang];
      const toGoBadge = cartela.oneToGo ? 
        `<span class="to-go-badge">${t.oneToGo}</span>` : 
        (cartela.twoToGo ? `<span class="to-go-badge" style="background:#00E5FF; color:#000;">${t.twoToGo}</span>` : '');

      card.innerHTML = `
        <div class="cartela-header">
          <div class="cartela-title">
            <span>🏷️</span> ${t.ticketLabel} #${cartela.id}
          </div>
          ${toGoBadge}
        </div>
        <div class="cartela-grid-table" id="cartelaGrid-${cartela.id}"></div>
      `;

      const gridTable = card.querySelector(`#cartelaGrid-${cartela.id}`);

      // Column Headers B-I-N-G-O
      BINGO_LETTERS.forEach(letter => {
        const header = document.createElement('div');
        header.className = `column-header ${letter.toLowerCase()}`;
        header.textContent = letter;
        gridTable.appendChild(header);
      });

      // 5x5 Cells
      cartela.grid.forEach((row, rIdx) => {
        row.forEach((cell, cIdx) => {
          const cellEl = document.createElement('div');
          cellEl.className = `grid-cell ${cell.isFree ? 'free-space' : ''} ${cell.daubed ? 'daubed' : ''}`;
          
          if (cell.isFree) {
            cellEl.innerHTML = `<span style="font-size:14px;">⭐</span><br><span style="font-size:9px;">የራሴ</span>`;
          } else {
            cellEl.textContent = cell.number;
          }

          // Click to manual daub
          cellEl.addEventListener('click', () => {
            if (this.activeRoomSession) {
              this.activeRoomSession.userManualDaub(cartela.id, rIdx, cIdx);
            }
          });

          gridTable.appendChild(cellEl);
        });
      });

      container.appendChild(card);
    });
  }

  handleUserClaimBingo() {
    if (!this.activeRoomSession) return;
    const winningCartela = this.activeRoomSession.userCartelas.find(c => c.hasWon);
    if (winningCartela) {
      telegram.hapticNotification('success');
      // Credit wallet
      wallet.addWinnings(this.activeRoomSession.potPool, `BINGO Win on #${winningCartela.id}!`);
      this.triggerConfetti();
      this.showWinnerModal({
        isUser: true,
        name: "You (ተጫዋች) 🎉",
        cartelaId: winningCartela.id,
        pattern: winningCartela.winPattern || "Horizontal Line",
        prize: this.activeRoomSession.potPool
      });
    }
  }

  showWinnerModal(winner) {
    this.dom.winnerModalAmount.textContent = `${winner.prize.toLocaleString()} ETB`;
    this.dom.winnerModalName.textContent = winner.name;
    const t = translations[this.currentLang];
    this.dom.winnerModalPattern.textContent = `${t.winningCartela} #${winner.cartelaId} (${winner.pattern})`;

    this.triggerConfetti();
    this.dom.winnerModal.style.display = 'flex';
  }

  triggerConfetti() {
    if (typeof window.confetti === 'function') {
      window.confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#00D26A', '#FFB800', '#FF3366', '#00E5FF']
      });
    }
  }

  renderChatStream(messages) {
    const box = this.dom.chatStreamBox;
    box.innerHTML = '';
    messages.forEach(msg => {
      const bubble = document.createElement('div');
      bubble.className = `chat-message-bubble ${msg.isSystem ? 'system' : ''}`;
      bubble.innerHTML = `
        <div class="chat-meta">
          <span class="chat-sender">${msg.sender}</span>
          <span>${msg.time}</span>
        </div>
        <div>${msg.text}</div>
      `;
      box.appendChild(bubble);
    });
    box.scrollTop = box.scrollHeight;
  }

  applyLanguage(lang) {
    const t = translations[lang] || translations.am;
    this.dom.langCurrentLabel.textContent = lang === 'am' ? 'አማርኛ' : 'English';

    // Header
    this.dom.txtBrandName.textContent = t.brandName;
    this.dom.txtBrandSub.textContent = t.brandSubtitle;
    this.dom.lblBalance.textContent = `${t.balance}:`;
    this.dom.lblDeposit.textContent = t.deposit;

    // Lobby
    document.getElementById('txtLobbyHeading').textContent = `${t.chooseRoom} • ${translations.en.chooseRoom}`;
    document.getElementById('txtLobbyDesc').textContent = t.roomSubtitle;
    document.getElementById('txtRoom10Title').textContent = t.roomSilverTitle;
    document.getElementById('txtRoom20Title').textContent = t.roomGoldTitle;
    document.getElementById('lblPot10').textContent = `${t.currentPot}:`;
    document.getElementById('lblPot20').textContent = `${t.currentPot}:`;
    document.getElementById('lblEnterRoom10').textContent = `${t.joinRoom} (10 ETB)`;
    document.getElementById('lblEnterRoom20').textContent = `${t.joinRoom} (20 ETB)`;

    // Game
    this.dom.lblBackLobby.textContent = t.backToLobby;
    this.dom.lblMetricRound.textContent = `${t.currentRound}:`;
    this.dom.lblMetricPlayers.textContent = `${t.playersOnline}:`;
    this.dom.lblMetricPot.textContent = `${t.currentPot}:`;
    this.dom.lblAutoDaub.textContent = this.autoDaubEnabled ? 
      `⚡ ${t.autoDaub}: ON` : `✋ ${t.manualDaub}: ON`;
    this.dom.lblBuyMore.textContent = t.buyMore;
    this.dom.lblClaimBingo.textContent = `${t.claimBingo} • CLAIM BINGO!`;
    this.dom.lblLiveChat.textContent = t.liveActivity;

    // Modals
    document.getElementById('txtWalletTitle').textContent = t.walletTitle;
    document.getElementById('lblConfirmDepositBtn').textContent = t.confirmDeposit;
    document.getElementById('txtSelectCartelas').textContent = t.selectCartelas;
    document.getElementById('lblConfirmBuyBtn').textContent = t.buyCartela;

    if (this.activeRoomSession) {
      this.renderGameState(this.activeRoomSession);
    }
  }
}

// Instantiate on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new AppController();
  app.init();
  window.yeraseBingoApp = app;
});
