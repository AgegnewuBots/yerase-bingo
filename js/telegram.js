/**
 * Yerase Bingo (የራሴ ቢንጎ) - Telegram Mini App (TMA) Integration & Simulator
 * Handles Telegram WebApp SDK bindings, haptics, theme matching, and desktop preview simulator.
 */

class TelegramIntegration {
  constructor() {
    this.tg = window.Telegram?.WebApp || null;
    this.isInsideTelegram = !!(this.tg && this.tg.initData);
    this.isSimulatorActive = false;
    this.init();
  }

  init() {
    if (this.isInsideTelegram) {
      console.log("🚀 Yerase Bingo running inside Telegram Mini App!");
      try {
        this.tg.ready();
        this.tg.expand();
        this.tg.setHeaderColor('#0B0E14');
        this.tg.setBackgroundColor('#0B0E14');
        if (this.tg.enableClosingConfirmation) {
          this.tg.enableClosingConfirmation();
        }
      } catch (e) {
        console.warn("Telegram WebApp init error:", e);
      }
    }
  }

  getUser() {
    if (this.isInsideTelegram && this.tg.initDataUnsafe?.user) {
      const u = this.tg.initDataUnsafe.user;
      return {
        id: u.id,
        name: [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || 'Telegram User',
        username: u.username ? `@${u.username}` : '@yerase_player',
        avatar: u.photo_url || null
      };
    }
    // Default simulated user profile
    return {
      id: 994821,
      name: 'Yerase VIP Player',
      username: '@yerase_vip',
      avatar: null
    };
  }

  hapticImpact(style = 'medium') {
    if (this.tg?.HapticFeedback?.impactOccurred) {
      this.tg.HapticFeedback.impactOccurred(style);
    } else if (navigator.vibrate) {
      navigator.vibrate(25);
    }
  }

  hapticNotification(type = 'success') {
    if (this.tg?.HapticFeedback?.notificationOccurred) {
      this.tg.HapticFeedback.notificationOccurred(type);
    } else if (navigator.vibrate) {
      navigator.vibrate([40, 60, 100]);
    }
  }

  toggleSimulator(forceState = null) {
    this.isSimulatorActive = forceState !== null ? forceState : !this.isSimulatorActive;
    const body = document.body;
    if (this.isSimulatorActive) {
      body.classList.add('telegram-sim-active');
    } else {
      body.classList.remove('telegram-sim-active');
    }
    return this.isSimulatorActive;
  }
}

export const telegram = new TelegramIntegration();
