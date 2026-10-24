/**
 * Yerase Bingo (የራሴ ቢንጎ) - Ethiopian Birr (ETB) Wallet Manager
 * Supports Telebirr and CBE Birr instant deposits, withdrawals, and balance persistence.
 */

import { audio } from './audio.js';

const STORAGE_KEY = 'yerase_bingo_wallet';
const INITIAL_BALANCE = 250; // Welcome trial bonus in ETB so user can play immediately

class WalletManager {
  constructor() {
    this.balance = this.loadBalance();
    this.listeners = [];
    this.transactions = this.loadTransactions();
  }

  loadBalance() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        return Math.max(0, parseFloat(stored) || 0);
      }
    } catch (e) {
      console.warn("Storage read error:", e);
    }
    return INITIAL_BALANCE;
  }

  saveBalance() {
    try {
      localStorage.setItem(STORAGE_KEY, this.balance.toFixed(2));
      localStorage.setItem(STORAGE_KEY + '_tx', JSON.stringify(this.transactions.slice(0, 30)));
    } catch (e) {
      console.warn("Storage save error:", e);
    }
  }

  loadTransactions() {
    try {
      const tx = localStorage.getItem(STORAGE_KEY + '_tx');
      if (tx) return JSON.parse(tx);
    } catch (e) {}
    return [
      { id: 'TX-INIT', type: 'BONUS', method: 'Welcome Bonus', amount: INITIAL_BALANCE, date: new Date().toLocaleTimeString() }
    ];
  }

  getBalance() {
    return this.balance;
  }

  subscribe(listener) {
    if (typeof listener === 'function') {
      this.listeners.push(listener);
      listener(this.balance);
    }
  }

  notify() {
    this.listeners.forEach(cb => {
      try { cb(this.balance); } catch (e) { console.error(e); }
    });
  }

  canAfford(amount) {
    return this.balance >= amount;
  }

  deduct(amount, reason = 'Cartela purchase') {
    if (this.balance < amount) return false;
    this.balance -= amount;
    this.transactions.unshift({
      id: 'TX-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      type: 'DEBIT',
      method: reason,
      amount: -amount,
      date: new Date().toLocaleTimeString()
    });
    this.saveBalance();
    this.notify();
    return true;
  }

  addWinnings(amount, reason = 'Bingo Win!') {
    this.balance += amount;
    this.transactions.unshift({
      id: 'TX-WIN-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      type: 'WIN',
      method: reason,
      amount: amount,
      date: new Date().toLocaleTimeString()
    });
    audio.playWinFanfare();
    audio.playCoinChime();
    this.saveBalance();
    this.notify();
  }

  deposit(amount, method = 'Telebirr') {
    if (amount <= 0) return false;
    this.balance += amount;
    this.transactions.unshift({
      id: 'TX-DEP-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      type: 'CREDIT',
      method: method,
      amount: amount,
      date: new Date().toLocaleTimeString()
    });
    audio.playCoinChime();
    this.saveBalance();
    this.notify();
    return true;
  }

  resetDemoBalance() {
    this.balance = 500;
    this.saveBalance();
    this.notify();
  }
}

export const wallet = new WalletManager();
