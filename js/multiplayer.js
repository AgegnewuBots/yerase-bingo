/**
 * Yerase Bingo (የራሴ ቢንጎ) - 400-Player Multiplayer Simulation & Room Engine
 * Simulates up to 400 live Ethiopian players, dynamic pot scaling, realistic bot daubing,
 * live chat stream, and real-time round cycle.
 */

import { generateCartela, checkCartelaWin, calculateToGo, createBallDeck } from './bingo-engine.js';
import { audio } from './audio.js';

const ETHIOPIAN_NAMES = [
  "Abebe Bekele", "Selamawit Tadesse", "Dawit Kebede", "Almaz Mengistu",
  "Henok Girma", "Marta Haile", "Natnael Desta", "Yonas Fikru",
  "Bethelhem Kassa", "Ermias Worku", "Rahel Tesfaye", "Kassahun Wale",
  "Biruk Zewdu", "Hiwot Mekonnen", "Solomon Engida", "Tigist Yilma",
  "Abel Negash", "Genet Assefa", "Biniyam Lemma", "Frehiwot Gashaw",
  "Mulugeta Birhanu", "Meseret Alemu", "Tewodros Kassaye", "Samrawit Belay",
  "Tamrat Dagne", "Hanna Getachew", "Yared Wolde", "Senait Hailu",
  "Addisu Berhanu", "Kidist Tilahun", "Surafel Tefera", "Wubit Shibeshi"
];

const CHAT_TEMPLATES_AM = [
  "መልካም እድል ለሁላችንም! 🤞",
  "ዛሬ 8,000 ብር የኔ ነው አቦ! 🔥",
  "የራሴ ቢንጎ ምርጥ ነው!",
  "1 ቀሪ ብቻ አለኝ 😱 ቶሎ ውጣ!",
  "እንኳን ደስ አለህ አሸናፊ! 🎉",
  "ካርቴላዬ እየሞላች ነው!",
  "ተጨማሪ 20 ብር ቆርጫለሁ 💪",
  "ዋንጫውን ዛሬ ማንም አይወስድብኝም",
  "B-12 ወጣልኝ በስንት መከራ 😂",
  "ይሄ ዙር አሪፍ እየሄደ ነው!"
];

const CHAT_TEMPLATES_EN = [
  "Good luck everyone! 🤞",
  "This jackpot is mine today! 🔥",
  "Yerase Bingo is so fast and smooth!",
  "Only 1 to go!! Come on N-34! 😱",
  "Congratulations to the winner! 🎉",
  "Bought 4 cartelas this round, let's go!",
  "Playing the 20 ETB room is lit 💎",
  "Need just one diagonal ball!",
  "Great game!!",
  "Ready for the next round!"
];

export class RoomSession {
  constructor(roomType, onStateChange, onChatUpdate) {
    this.roomType = roomType; // '10' or '20'
    this.pricePerCartela = roomType === '20' ? 20 : 10;
    this.onStateChange = onStateChange;
    this.onChatUpdate = onChatUpdate;
    
    // Config
    this.maxPlayers = 400;
    this.targetPlayers = Math.floor(340 + Math.random() * 58); // Realistic 340-398 players
    this.playerCount = 0;
    this.totalCartelasInPlay = 0;
    this.potPool = 0;
    
    // Game Loop States: 'BUYING', 'PLAYING', 'WINNER'
    this.status = 'BUYING';
    this.roundNumber = Math.floor(100 + Math.random() * 900);
    this.buyCountdown = 25; // seconds
    this.ballInterval = null;
    this.timerInterval = null;
    this.ballDrawSpeed = 3200; // ms per ball
    
    // Bingo Balls
    this.ballDeck = [];
    this.calledBalls = [];
    this.currentBall = null;
    
    // User Cartelas
    this.userCartelas = [];
    this.autoDaub = true;
    
    // Simulated Bots
    this.bots = [];
    this.winnerInfo = null;

    // Chat
    this.chatMessages = [];
  }

  start() {
    this.initBots();
    this.startBuyingPhase();
    this.startChatGenerator();
  }

  stop() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.ballInterval) clearInterval(this.ballInterval);
    if (this.chatInterval) clearInterval(this.chatInterval);
  }

  setDrawSpeed(speedMs) {
    this.ballDrawSpeed = speedMs;
    if (this.status === 'PLAYING' && this.ballInterval) {
      clearInterval(this.ballInterval);
      this.ballInterval = setInterval(() => this.drawNextBall(), this.ballDrawSpeed);
    }
  }

  initBots() {
    this.bots = [];
    const botCount = this.targetPlayers - 1;
    for (let i = 0; i < botCount; i++) {
      const name = ETHIOPIAN_NAMES[i % ETHIOPIAN_NAMES.length] + (i > 30 ? ` #${i}` : '');
      const cartelaCount = Math.random() > 0.6 ? 2 : (Math.random() > 0.85 ? 3 : 1);
      const cartelas = [];
      for (let c = 0; c < cartelaCount; c++) {
        cartelas.push(generateCartela(10 + i * 4 + c));
      }
      this.bots.push({
        id: `bot-${i}`,
        name,
        cartelaCount,
        cartelas
      });
    }
  }

  startBuyingPhase() {
    this.status = 'BUYING';
    this.buyCountdown = 22;
    this.calledBalls = [];
    this.currentBall = null;
    this.winnerInfo = null;
    this.ballDeck = createBallDeck();

    // Reset user cartela states
    this.userCartelas.forEach(c => {
      c.grid.forEach(row => row.forEach(cell => {
        if (!cell.isFree) cell.daubed = false;
      }));
      c.oneToGo = false;
      c.twoToGo = false;
      c.hasWon = false;
      c.winPattern = null;
    });

    // Simulate crowd rapidly joining up to ~400 players
    this.playerCount = Math.floor(180 + Math.random() * 50);
    this.updatePot();

    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.buyCountdown--;

      // Realistic player climb
      if (this.playerCount < this.targetPlayers) {
        this.playerCount += Math.floor(8 + Math.random() * 14);
        if (this.playerCount > this.targetPlayers) this.playerCount = this.targetPlayers;
        this.updatePot();
      }

      if (this.buyCountdown <= 5 && this.buyCountdown > 0) {
        audio.playTick();
      }

      if (this.buyCountdown <= 0) {
        clearInterval(this.timerInterval);
        this.startPlayingPhase();
      }

      this.notifyState();
    }, 1000);

    this.notifyState();
  }

  updatePot() {
    // Total active cartelas = bot cartelas + user cartelas
    const botCartelasCount = this.bots.reduce((sum, b) => sum + b.cartelaCount, 0);
    this.totalCartelasInPlay = botCartelasCount + this.userCartelas.length;
    // Pot = 85% of total stake (15% house/mega jackpot fee)
    const grossStake = this.totalCartelasInPlay * this.pricePerCartela;
    this.potPool = Math.round(grossStake * 0.85);
  }

  startPlayingPhase() {
    this.status = 'PLAYING';
    this.notifyState();

    // First ball draw delay
    setTimeout(() => {
      this.drawNextBall();
      this.ballInterval = setInterval(() => {
        this.drawNextBall();
      }, this.ballDrawSpeed);
    }, 1200);
  }

  drawNextBall() {
    if (this.ballDeck.length === 0 || this.status !== 'PLAYING') {
      if (this.ballInterval) clearInterval(this.ballInterval);
      return;
    }

    const ball = this.ballDeck.pop();
    this.currentBall = ball;
    this.calledBalls.unshift(ball);

    // Audio & Voice Effects
    audio.playBallDrop();
    audio.speakBall(ball.letter, ball.number);

    // Update User Cartelas
    this.processUserDaubs(ball);

    // Update Bot Cartelas & Check Winner
    this.processBotDaubs(ball);

    this.notifyState();
  }

  processUserDaubs(ball) {
    let triggeredHeartbeat = false;

    this.userCartelas.forEach(cartela => {
      if (this.autoDaub) {
        // Auto-mark
        cartela.grid.forEach(row => {
          row.forEach(cell => {
            if (cell.number === ball.number) {
              cell.daubed = true;
              audio.playDaub();
            }
          });
        });
      }

      // Check win
      const winCheck = checkCartelaWin(cartela);
      if (winCheck.isWin && !cartela.hasWon) {
        cartela.hasWon = true;
        cartela.winPattern = winCheck.pattern;
        cartela.winningCells = winCheck.cells;
        this.declareWinner({
          isUser: true,
          name: "You (ተጫዋች)",
          cartelaId: cartela.id,
          pattern: winCheck.pattern,
          prize: this.potPool
        });
      } else {
        // Check 1-To-Go tension
        const toGo = calculateToGo(cartela);
        cartela.oneToGo = toGo.oneToGo;
        cartela.twoToGo = toGo.twoToGo;
        if (toGo.oneToGo && !triggeredHeartbeat) {
          audio.playHeartbeat();
          triggeredHeartbeat = true;
        }
      }
    });
  }

  processBotDaubs(ball) {
    if (this.status !== 'PLAYING') return;

    // After at least 16 balls called, bots have realistic chance to win
    if (this.calledBalls.length >= 18) {
      for (const bot of this.bots) {
        for (const cartela of bot.cartelas) {
          // Mark bot cell
          cartela.grid.forEach(row => {
            row.forEach(cell => {
              if (cell.number === ball.number) cell.daubed = true;
            });
          });

          // Check bot win
          const winCheck = checkCartelaWin(cartela);
          if (winCheck.isWin) {
            this.declareWinner({
              isUser: false,
              name: bot.name,
              cartelaId: cartela.id,
              pattern: winCheck.pattern,
              prize: this.potPool
            });
            return;
          }
        }
      }
    } else {
      // Just mark bot cells
      this.bots.forEach(bot => {
        bot.cartelas.forEach(c => {
          c.grid.forEach(r => r.forEach(cell => {
            if (cell.number === ball.number) cell.daubed = true;
          }));
        });
      });
    }
  }

  declareWinner(winner) {
    this.status = 'WINNER';
    this.winnerInfo = winner;
    if (this.ballInterval) clearInterval(this.ballInterval);

    // Announce in chat
    this.addChatMessage(
      "ቢንጎ አሸናፊ / BINGO!",
      `🎉 ${winner.name} won ${winner.prize.toLocaleString()} ETB on Cartela #${winner.cartelaId} (${winner.pattern})!`,
      true
    );

    this.notifyState();

    // Auto restart after 10 seconds
    setTimeout(() => {
      this.roundNumber++;
      this.startBuyingPhase();
    }, 10000);
  }

  userManualDaub(cartelaId, row, col) {
    const cartela = this.userCartelas.find(c => c.id === cartelaId);
    if (!cartela || this.status !== 'PLAYING') return;

    const cell = cartela.grid[row][col];
    if (cell.isFree) return;

    // Check if the number was actually called
    const wasCalled = this.calledBalls.some(b => b.number === cell.number);
    if (wasCalled) {
      cell.daubed = !cell.daubed;
      audio.playDaub();

      const winCheck = checkCartelaWin(cartela);
      if (winCheck.isWin && !cartela.hasWon) {
        cartela.hasWon = true;
        cartela.winPattern = winCheck.pattern;
        cartela.winningCells = winCheck.cells;
        this.declareWinner({
          isUser: true,
          name: "You (ተጫዋች)",
          cartelaId: cartela.id,
          pattern: winCheck.pattern,
          prize: this.potPool
        });
      } else {
        const toGo = calculateToGo(cartela);
        cartela.oneToGo = toGo.oneToGo;
        cartela.twoToGo = toGo.twoToGo;
        if (toGo.oneToGo) audio.playHeartbeat();
      }

      this.notifyState();
    }
  }

  addChatMessage(sender, text, isSystem = false) {
    const msg = {
      id: Math.random().toString(36).substring(2, 9),
      sender,
      text,
      isSystem,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    this.chatMessages.push(msg);
    if (this.chatMessages.length > 40) this.chatMessages.shift();
    if (this.onChatUpdate) this.onChatUpdate(this.chatMessages);
  }

  startChatGenerator() {
    this.chatInterval = setInterval(() => {
      if (Math.random() > 0.4) {
        const isAm = Math.random() > 0.45;
        const pool = isAm ? CHAT_TEMPLATES_AM : CHAT_TEMPLATES_EN;
        const text = pool[Math.floor(Math.random() * pool.length)];
        const sender = ETHIOPIAN_NAMES[Math.floor(Math.random() * ETHIOPIAN_NAMES.length)];
        this.addChatMessage(sender, text);
      }
    }, 4500);
  }

  notifyState() {
    if (this.onStateChange) {
      this.onStateChange({
        roomType: this.roomType,
        pricePerCartela: this.pricePerCartela,
        status: this.status,
        roundNumber: this.roundNumber,
        buyCountdown: this.buyCountdown,
        playerCount: this.playerCount,
        maxPlayers: this.maxPlayers,
        totalCartelasInPlay: this.totalCartelasInPlay,
        potPool: this.potPool,
        calledBalls: this.calledBalls,
        currentBall: this.currentBall,
        userCartelas: this.userCartelas,
        autoDaub: this.autoDaub,
        winnerInfo: this.winnerInfo
      });
    }
  }
}
