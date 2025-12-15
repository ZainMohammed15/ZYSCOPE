// Enhanced Game Audio System with Web Audio API
class AudioSystem {
  constructor() {
    this.context = null;
    this.sounds = {};
    this.enabled = true;
    this.volume = 0.3;
    this.lastPlayTime = {};
    this.cooldowns = {
      hover: 50,
      click: 100,
      default: 200
    };
  }

  init() {
    if (!this.context) {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  // Prevent sound spam with cooldowns
  canPlay(soundName) {
    const now = Date.now();
    const cooldown = this.cooldowns[soundName] || this.cooldowns.default;
    const lastTime = this.lastPlayTime[soundName] || 0;
    
    if (now - lastTime < cooldown) {
      return false;
    }
    
    this.lastPlayTime[soundName] = now;
    return true;
  }

  // Generate tones programmatically
  playTone(frequency, duration, type = 'sine', soundName = 'default') {
    if (!this.enabled || !this.canPlay(soundName)) return;
    this.init();

    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.context.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(this.volume, this.context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);

    oscillator.start(this.context.currentTime);
    oscillator.stop(this.context.currentTime + duration);
  }

  // === CORE UI SOUNDS ===
  playHover() {
    this.playTone(600, 0.03, 'sine', 'hover');
  }

  playClick() {
    this.playTone(800, 0.05, 'square', 'click');
  }

  playConfirm() {
    this.playTone(880, 0.1, 'sine', 'confirm');
    setTimeout(() => this.playTone(1174.66, 0.15, 'sine', 'confirm'), 100);
  }

  playError() {
    this.playTone(200, 0.2, 'sawtooth', 'error');
  }

  // === GAME-STYLE SOUNDS ===
  playXP() {
    this.playTone(1046.50, 0.08, 'sine', 'xp');
    setTimeout(() => this.playTone(1318.51, 0.12, 'sine', 'xp'), 80);
  }

  playAchievement() {
    this.playTone(523.25, 0.1, 'sine', 'achievement');
    setTimeout(() => this.playTone(659.25, 0.1, 'sine', 'achievement'), 100);
    setTimeout(() => this.playTone(783.99, 0.2, 'sine', 'achievement'), 200);
  }

  playLevelUp() {
    this.playTone(440, 0.1, 'sine', 'levelup');
    setTimeout(() => this.playTone(554.37, 0.1, 'sine', 'levelup'), 80);
    setTimeout(() => this.playTone(659.25, 0.1, 'sine', 'levelup'), 160);
    setTimeout(() => this.playTone(880, 0.25, 'sine', 'levelup'), 240);
  }

  playPageLoad() {
    this.playTone(523.25, 0.08, 'sine', 'pageload');
    setTimeout(() => this.playTone(659.25, 0.08, 'sine', 'pageload'), 60);
    setTimeout(() => this.playTone(783.99, 0.1, 'sine', 'pageload'), 120);
  }

  playMapSelect() {
    this.playTone(698.46, 0.08, 'triangle', 'mapselect');
  }

  playSpin() {
    this.playTone(440, 0.05, 'sine', 'spin');
    setTimeout(() => this.playTone(554.37, 0.05, 'sine', 'spin'), 50);
    setTimeout(() => this.playTone(659.25, 0.05, 'sine', 'spin'), 100);
    setTimeout(() => this.playTone(783.99, 0.08, 'sine', 'spin'), 150);
  }

  playReview() {
    this.playTone(880, 0.1, 'sine', 'review');
    setTimeout(() => this.playTone(1046.50, 0.15, 'sine', 'review'), 100);
  }

  // Legacy methods (keep for compatibility)
  click() { this.playClick(); }
  hover() { this.playHover(); }
  success() { this.playConfirm(); }
  achievement() { this.playAchievement(); }
  notification() { this.playXP(); }
  error() { this.playError(); }
  unlock() { this.playAchievement(); }
  levelUp() { this.playLevelUp(); }

  toggleSound() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
  }
}

export const audio = new AudioSystem();
