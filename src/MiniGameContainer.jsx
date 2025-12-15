/* =========================================================
   ZAIN'S TRAVEL HOP
   Pure Retro Arcade Platformer - Integrated Version
   ========================================================= */

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Phaser from 'phaser';

/* =========================
   RETRO CONFIG
========================= */

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const LIVES_START = 3;

// Simple audio preferences with localStorage persistence
const AudioPrefs = {
  key: 'zth_audio',
  load() {
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return { muted: false, volume: 0.6 };
      const obj = JSON.parse(raw);
      return { muted: !!obj.muted, volume: Math.min(1, Math.max(0, obj.volume ?? 0.6)) };
    } catch {
      return { muted: false, volume: 0.6 };
    }
  },
  save(prefs) {
    try { localStorage.setItem(this.key, JSON.stringify(prefs)); } catch {}
  }
};

/* =========================
   FIXED RETRO PHYSICS
========================= */

const PHYSICS = {
  SPEED: 160,
  JUMP: -380,
  GRAVITY: 980,
  ENEMY_SPEED: 50
};

/* =========================
   SOUND EFFECTS
========================= */

class RetroSound {
  constructor() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
  }

  play(type) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    switch(type) {
      case 'jump':
        osc.frequency.value = 440;
        gain.gain.value = 0.15;
        osc.start();
        osc.stop(this.ctx.currentTime + 0.08);
        break;
      case 'death':
        osc.frequency.value = 120;
        gain.gain.value = 0.2;
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
        osc.stop(this.ctx.currentTime + 0.3);
        break;
      case 'coin':
        osc.frequency.value = 880;
        gain.gain.value = 0.1;
        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
        break;
      case 'clear':
        osc.frequency.value = 660;
        gain.gain.value = 0.12;
        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
        break;
    }
  }
}

/* =========================
   PLAYER
========================= */

class Player {
  constructor(scene, x, y) {
    this.scene = scene;
    this.sprite = scene.physics.add.sprite(x, y, "player");
    this.sprite.setCollideWorldBounds(true);
    this.sprite.body.setGravityY(PHYSICS.GRAVITY);
    
    this.grounded = false;
    this.jumpPressed = false;
    this.facing = "right";
    this.canFly = false;
    this.hasDoubleJump = false;
    this.jumpsUsed = 0;
    this.jumpBoost = 1;
    this.footstepCooldown = false;
    this.animTime = 0;
    this.animFrame = 0;
    this.sprite.setTexture('player_idle');
  }

  update() {
    const body = this.sprite.body;
    this.grounded = body.blocked.down;
    if (this.grounded) this.jumpsUsed = 0;

    if (this.scene.cursors.left.isDown) {
      body.velocity.x = -PHYSICS.SPEED;
      this.facing = "left";
      this.sprite.setFlipX(true);
    } else if (this.scene.cursors.right.isDown) {
      body.velocity.x = PHYSICS.SPEED;
      this.facing = "right";
      this.sprite.setFlipX(false);
    } else {
      body.velocity.x = 0;
    }

    const jumpKey = Phaser.Input.Keyboard.JustDown(this.scene.cursors.up) || 
                    Phaser.Input.Keyboard.JustDown(this.scene.cursors.space);
    
    if (jumpKey && this.grounded) {
      body.velocity.y = PHYSICS.JUMP * this.jumpBoost;
      this.scene.retroSound.play('jump');
      try {
        const t = this.scene.add.text(this.sprite.x, this.sprite.y - 24, "OH AYE!", { font: "14px monospace", color: "#ffdd00" });
        this.scene.time.delayedCall(600, () => t.destroy());
      } catch {}
    } else if (jumpKey && !this.grounded && this.hasDoubleJump && this.jumpsUsed < 1) {
      body.velocity.y = PHYSICS.JUMP * this.jumpBoost;
      this.jumpsUsed += 1;
      this.scene.retroSound.play('jump');
      try {
        const t = this.scene.add.text(this.sprite.x, this.sprite.y - 24, "OH AYE!", { font: "14px monospace", color: "#ffdd00" });
        this.scene.time.delayedCall(600, () => t.destroy());
      } catch {}
    } else if (this.scene.cursors.up.isDown && !this.grounded && this.canFly) {
      body.velocity.y = PHYSICS.JUMP / 2.5;
      this.scene.retroSound.play('jump');
      try {
        const t = this.scene.add.text(this.sprite.x, this.sprite.y - 24, "OH AYE!", { font: "14px monospace", color: "#ffdd00" });
        this.scene.time.delayedCall(600, () => t.destroy());
      } catch {}
    }
    
    if (this.grounded && body.velocity.x !== 0 && !this.footstepCooldown) {
      this.scene.retroSound.play('coin');
      this.footstepCooldown = true;
      this.scene.time.delayedCall(200, () => { this.footstepCooldown = false; });
    }

    if (!this.grounded) {
      this.sprite.setTexture('player_jump');
    } else if (Math.abs(body.velocity.x) > 0) {
      this.animTime += 1;
      if (this.animTime % 12 === 0) this.animFrame = 1 - this.animFrame;
      this.sprite.setTexture(this.animFrame ? 'player_walk1' : 'player_walk2');
    } else {
      this.sprite.setTexture('player_idle');
    }
  }

  die() {
    this.scene.retroSound.play('death');
    this.sprite.setTint(0xff0000);
    this.sprite.body.enable = false;
    
    this.scene.time.delayedCall(400, () => {
      this.scene.lives -= 1;
      if (this.scene.lives <= 0) {
        this.scene.gameOver();
      } else {
        this.scene.scene.restart({
          level: this.scene.currentLevel,
          score: this.scene.score,
          lives: this.scene.lives
        });
      }
    });
  }
}

/* =========================
   ENEMY
========================= */

class Enemy {
  constructor(scene, x, y, range) {
    this.scene = scene;
    this.sprite = scene.physics.add.sprite(x, y, "enemy");
    this.originX = x;
    this.range = range;
    this.sprite.setVelocityX(PHYSICS.ENEMY_SPEED);
  }

  update() {
    if (this.sprite.x > this.originX + this.range) {
      this.sprite.setVelocityX(-PHYSICS.ENEMY_SPEED);
      this.sprite.setFlipX(true);
    } else if (this.sprite.x < this.originX - this.range) {
      this.sprite.setVelocityX(PHYSICS.ENEMY_SPEED);
      this.sprite.setFlipX(false);
    }
  }

  die() {
    this.sprite.destroy();
  }
}

/* =========================
   FLYING ENEMY (BAT)
========================= */

class FlyingEnemy {
  constructor(scene, x, y) {
    this.scene = scene;
    this.sprite = scene.physics.add.sprite(x, y, "enemy");
    this.baseY = y;
    this.t = 0;
    this.speed = 60;
    this.amplitude = 30;
    this.sprite.setVelocityX(Phaser.Math.Between(-60, 60) || 60);
    this.sprite.setBounce(1, 1);
    this.sprite.setCollideWorldBounds(true);
  }

  update() {
    this.t += 0.03;
    this.sprite.y = this.baseY + Math.sin(this.t) * this.amplitude;
    if (this.sprite.body.blocked.right) this.sprite.setVelocityX(-this.speed);
    if (this.sprite.body.blocked.left) this.sprite.setVelocityX(this.speed);
  }

  die() {
    this.sprite.destroy();
  }
}

/* =========================
   ASSETS
========================= */

function generateRetroAssets(scene) {
  const drawPlayer = (variant) => {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffcc99, 1);
    g.fillRect(6, 0, 12, 8);
    g.fillStyle(0x000000, 1);
    g.fillRect(9, 3, 1, 1);
    g.fillRect(14, 3, 1, 1);
    g.fillRect(10, 5, 4, 1);
    g.fillStyle(0x7b1e7a, 1);
    g.fillRect(4, -2, 16, 4);
    g.fillCircle(6, -2, 2);
    g.fillStyle(0x2a9d8f, 1);
    g.fillRect(4, 8, 16, 8);
    g.fillStyle(0xffcc99, 1);
    g.fillRect(2, 10, 2, 6);
    g.fillRect(20, 10, 2, 6);
    g.fillStyle(0x2b3a67, 1);
    g.fillRect(4, 16, 16, 8);
    g.lineStyle(1, 0x00ff66, 1);
    for (let i = 5; i < 20; i += 4) g.strokeLineShape(new Phaser.Geom.Line(i, 16, i, 24));
    g.lineStyle(1, 0xff3333, 1);
    for (let i = 16; i <= 24; i += 2) g.strokeLineShape(new Phaser.Geom.Line(4, i, 20, i));
    g.fillStyle(0x644536, 1);
    if (variant === 'walk1') {
      g.fillRect(6, 24, 4, 8);
      g.fillRect(14, 24, 4, 6);
    } else if (variant === 'walk2') {
      g.fillRect(6, 24, 4, 6);
      g.fillRect(14, 24, 4, 8);
    } else if (variant === 'jump') {
      g.fillRect(6, 24, 4, 6);
      g.fillRect(14, 22, 4, 6);
    } else {
      g.fillRect(6, 24, 4, 7);
      g.fillRect(14, 24, 4, 7);
    }
    g.fillStyle(0x111111, 1);
    g.fillRect(6, 31, 4, 2);
    g.fillRect(14, 31, 4, 2);
    return g;
  };
  drawPlayer('idle').generateTexture('player_idle', 24, 34);
  drawPlayer('walk1').generateTexture('player_walk1', 24, 34);
  drawPlayer('walk2').generateTexture('player_walk2', 24, 34);
  drawPlayer('jump').generateTexture('player_jump', 24, 34);
  const pi = scene.make.graphics({ x: 0, y: 0, add: false });
  pi.fillStyle(0x000000, 0);
  pi.generateTexture('player', 24, 34);
  scene.textures.remove('player');
  drawPlayer('idle').generateTexture('player', 24, 34);

  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0x999999, 1);
  g.fillRect(0, 0, 32, 32);
  g.lineStyle(2, 0x666666, 1);
  g.strokeRect(0, 0, 32, 32);
  g.generateTexture("ground", 32, 32);

  const c = scene.make.graphics({ x: 0, y: 0, add: false });
  c.fillStyle(0x9b59b6, 1);
  c.fillCircle(8, 8, 6);
  c.fillStyle(0x3d9970, 1);
  c.fillRect(6, 10, 4, 6);
  c.generateTexture("coin", 16, 16);

  const e = scene.make.graphics({ x: 0, y: 0, add: false });
  e.fillStyle(0xeeeeee, 1);
  e.fillRect(2, 6, 20, 10);
  e.fillCircle(6, 8, 5);
  e.fillStyle(0x000000, 1);
  e.fillCircle(5, 7, 2);
  e.generateTexture("enemy", 24, 16);

  const makeEnemy = (key, color) => {
    const eg = scene.make.graphics({ x: 0, y: 0, add: false });
    eg.fillStyle(color, 1);
    eg.fillRect(0, 0, 24, 16);
    eg.fillStyle(0x000000, 1);
    eg.fillRect(4, 6, 3, 3);
    eg.fillRect(16, 6, 3, 3);
    eg.generateTexture(key, 24, 16);
  };
  makeEnemy('enemyCow', 0x8b5a2b);
  makeEnemy('enemyNinja', 0x111111);
  makeEnemy('enemyScarab', 0x226622);
  makeEnemy('enemyMonkey', 0x6b4423);
  makeEnemy('enemyMime', 0xffffff);
  makeEnemy('enemyRat', 0x555555);
  makeEnemy('enemyGondolier', 0x113366);
  makeEnemy('enemyElephant', 0x8888aa);
  makeEnemy('enemyKangaroo', 0xb5651d);
  makeEnemy('enemyWarrior', 0x7f3b1a);

  const f = scene.make.graphics({ x: 0, y: 0, add: false });
  f.fillStyle(0x555555, 1);
  f.fillRect(0, 0, 4, 48);
  f.fillStyle(0x0051a5, 1);
  f.fillRect(4, 0, 28, 20);
  f.fillStyle(0xffffff, 1);
  for (let i = 0; i < 20; i++) {
    f.fillRect(4 + i, i * (20 / 28), 1, 1);
    f.fillRect(4 + 27 - i, i * (20 / 28), 1, 1);
  }
  f.generateTexture("flagScotland", 32, 48);

  const m1 = scene.make.graphics({ x: 0, y: 0, add: false });
  m1.fillStyle(0x3b5b84, 1);
  for (let i = 0; i < 8; i++) {
    const baseX = i * 50;
    m1.fillTriangle(baseX, 60, baseX + 25, 0, baseX + 50, 60);
  }
  m1.generateTexture("mountainFar", 400, 60);

  const m2 = scene.make.graphics({ x: 0, y: 0, add: false });
  m2.fillStyle(0x2f4668, 1);
  for (let i = 0; i < 6; i++) {
    const baseX = i * 66;
    m2.fillTriangle(baseX, 80, baseX + 33, 0, baseX + 66, 80);
  }
  m2.generateTexture("mountainNear", 400, 80);

  const wing = scene.make.graphics({ x: 0, y: 0, add: false });
  wing.fillStyle(0xffaa66, 1);
  wing.fillTriangle(2, 14, 14, 2, 14, 26);
  wing.fillStyle(0xffffff, 1);
  wing.fillRect(12, 10, 4, 8);
  wing.generateTexture('powerWing', 18, 28);

  const spring = scene.make.graphics({ x: 0, y: 0, add: false });
  spring.fillStyle(0x222222, 1);
  for (let i = 0; i < 6; i++) {
    spring.fillRect(2 + i*3, 6 + (i%2)*4, 2, 12 - (i%2)*2);
  }
  spring.fillStyle(0x66ff66, 1);
  spring.fillRect(0, 18, 18, 4);
  spring.generateTexture('powerSpring', 18, 22);

  const makeCollect = (key, colorA, colorB) => {
    const cg = scene.make.graphics({ x: 0, y: 0, add: false });
    cg.fillStyle(colorA, 1);
    cg.fillRect(2, 2, 12, 12);
    cg.fillStyle(colorB, 1);
    cg.fillRect(4, 4, 8, 8);
    cg.generateTexture(key, 16, 16);
  };
  makeCollect('thistle', 0x6a0dad, 0x9b59b6);
  makeCollect('lantern', 0xffe066, 0xffc857);
  makeCollect('scroll', 0xf1e3c6, 0xe2c799);
  makeCollect('banana', 0xffef5a, 0xffd300);
  makeCollect('croissant', 0xd4a574, 0xb07d45);
  makeCollect('dollar', 0x00a86b, 0x005f3f);
  makeCollect('pizza', 0xffcc33, 0xcc3333);
  makeCollect('spice', 0xff5722, 0xffa000);
  makeCollect('boomerang', 0x996633, 0xcc9966);
  makeCollect('trophy', 0xffd700, 0xffa500);

  const acc = (key, draw) => {
    const ag = scene.make.graphics({ x: 0, y: 0, add: false });
    draw(ag);
    ag.generateTexture(key, 16, 10);
  };
  acc('acc_scotland', (ag) => {
    ag.fillStyle(0x7b1e7a, 1);
    ag.fillRect(0, 2, 16, 4);
    ag.fillStyle(0xffffff, 1);
    ag.fillCircle(3, 2, 2);
  });
  acc('acc_japan', (ag) => {
    ag.fillStyle(0xffc0cb, 1);
    ag.fillRect(0, 3, 16, 3);
    ag.fillCircle(8, 2, 2);
  });
  acc('acc_egypt', (ag) => {
    ag.fillStyle(0xc2b280, 1);
    ag.fillRect(0, 2, 16, 4);
    ag.fillRect(2, 0, 4, 2);
  });
  acc('acc_brazil', (ag) => {
    ag.fillStyle(0x228b22, 1);
    ag.fillTriangle(0, 6, 8, 0, 16, 6);
  });
  acc('acc_france', (ag) => {
    ag.fillStyle(0x000000, 1);
    ag.fillRect(2, 4, 12, 2);
    ag.fillRect(6, 2, 4, 2);
  });
  acc('acc_usa', (ag) => {
    ag.fillStyle(0x1e90ff, 1);
    ag.fillRect(0, 2, 16, 3);
    ag.fillStyle(0xff0000, 1);
    ag.fillRect(0, 5, 16, 1);
  });
  acc('acc_italy', (ag) => {
    ag.fillStyle(0x006400, 1);
    ag.fillRect(0, 2, 5, 3);
    ag.fillStyle(0xffffff, 1);
    ag.fillRect(5, 2, 6, 3);
    ag.fillStyle(0xff0000, 1);
    ag.fillRect(11, 2, 5, 3);
  });
  acc('acc_india', (ag) => {
    ag.fillStyle(0xffa500, 1);
    ag.fillRect(0, 2, 16, 3);
    ag.fillStyle(0x008000, 1);
    ag.fillRect(0, 5, 16, 1);
  });
  acc('acc_australia', (ag) => {
    ag.fillStyle(0x8b4513, 1);
    ag.fillRect(2, 2, 12, 3);
    ag.fillRect(0, 5, 16, 2);
  });
  acc('acc_scotland_final', (ag) => {
    ag.fillStyle(0xffd700, 1);
    ag.fillRect(0, 2, 16, 4);
    ag.fillRect(6, 0, 4, 2);
  });
}

/* =========================
   WORLD THEMES & LEVELS
========================= */

const COMPLETION_PHRASES = [
  "FREEEDOMMM!"
];

const LEVELS = [
    // 1. Scotland – Highlands, mountains, lochs
    {
      name: "🏴 SCOTLAND",
      theme: 'scotland',
      bgColor: "#2d5a3d",
      enemyKey: 'enemyCow',
      collectKey: 'thistle',
      platforms: [
        { x: 400, y: 580, count: 25 },
        { x: 200, y: 450, count: 4 },
        { x: 450, y: 380, count: 5 },
        { x: 150, y: 300, count: 3 }
      ],
      enemies: [
        { x: 300, y: 540, range: 100 },
        { x: 500, y: 540, range: 120 },
        { x: 450, y: 340, range: 80 }
      ],
      coins: [
        { x: 150, y: 410 }, { x: 200, y: 410 }, { x: 250, y: 410 },
        { x: 450, y: 340 }, { x: 500, y: 340 }
      ],
      goalX: 760
    },
    // 2. Japan – Cherry blossoms, temples, pagodas
    {
      name: "🗾 JAPAN",
      theme: 'japan',
      bgColor: "#ff6b9d",
      enemyKey: 'enemyNinja',
      collectKey: 'lantern',
      platforms: [
        { x: 400, y: 580, count: 25 },
        { x: 150, y: 480, count: 3 },
        { x: 350, y: 420, count: 4 },
        { x: 550, y: 360, count: 4 },
        { x: 250, y: 280, count: 3 }
      ],
      enemies: [
        { x: 250, y: 540, range: 80 }, { x: 450, y: 540, range: 100 },
        { x: 350, y: 380, range: 60 }, { x: 550, y: 320, range: 70 }
      ],
      coins: [
        { x: 150, y: 440 }, { x: 180, y: 440 }, { x: 350, y: 380 },
        { x: 400, y: 380 }, { x: 550, y: 320 }, { x: 600, y: 320 }
      ],
      goalX: 760
    },
    // 3. Egypt – Desert, pyramids, Nile
    {
      name: "🏜️ EGYPT",
      theme: 'egypt',
      bgColor: "#d4a574",
      enemyKey: 'enemyScarab',
      collectKey: 'scroll',
      platforms: [
        { x: 400, y: 580, count: 25 },
        { x: 100, y: 500, count: 2 },
        { x: 250, y: 440, count: 3 },
        { x: 450, y: 380, count: 3 },
        { x: 650, y: 320, count: 3 },
        { x: 350, y: 260, count: 4 }
      ],
      enemies: [
        { x: 200, y: 540, range: 80 }, { x: 400, y: 540, range: 90 },
        { x: 600, y: 540, range: 100 }, { x: 250, y: 400, range: 50 },
        { x: 450, y: 340, range: 60 }
      ],
      coins: [
        { x: 100, y: 460 }, { x: 130, y: 460 }, { x: 250, y: 400 }, { x: 280, y: 400 },
        { x: 450, y: 340 }, { x: 480, y: 340 }, { x: 650, y: 280 }, { x: 680, y: 280 }
      ],
      goalX: 760
    },
    // 4. Brazil – Amazon jungle
    {
      name: "🇧🇷 BRAZIL",
      theme: 'brazil',
      bgColor: "#00a859",
      enemyKey: 'enemyMonkey',
      collectKey: 'banana',
      platforms: [
        { x: 400, y: 580, count: 25 },
        { x: 180, y: 470, count: 4 },
        { x: 420, y: 400, count: 5 },
        { x: 600, y: 330, count: 3 },
        { x: 300, y: 260, count: 4 }
      ],
      enemies: [
        { x: 280, y: 540, range: 90 }, { x: 520, y: 540, range: 110 },
        { x: 420, y: 360, range: 70 }, { x: 600, y: 290, range: 50 }
      ],
      coins: [
        { x: 180, y: 430 }, { x: 210, y: 430 }, { x: 420, y: 360 }, { x: 450, y: 360 },
        { x: 600, y: 290 }, { x: 630, y: 290 }
      ],
      goalX: 760
    },
    // 5. France – Paris
    {
      name: "🗼 FRANCE",
      theme: 'france',
      bgColor: "#004170",
      enemyKey: 'enemyMime',
      collectKey: 'croissant',
      platforms: [
        { x: 400, y: 580, count: 25 },
        { x: 120, y: 490, count: 3 },
        { x: 320, y: 420, count: 4 },
        { x: 520, y: 350, count: 4 },
        { x: 700, y: 280, count: 2 }
      ],
      enemies: [
        { x: 220, y: 540, range: 85 }, { x: 480, y: 540, range: 95 },
        { x: 320, y: 380, range: 65 }, { x: 520, y: 310, range: 55 }
      ],
      coins: [
        { x: 120, y: 450 }, { x: 150, y: 450 }, { x: 320, y: 380 }, { x: 350, y: 380 },
        { x: 520, y: 310 }, { x: 550, y: 310 }, { x: 700, y: 240 }
      ],
      goalX: 760
    },
    // 6. USA – New York
    {
      name: "🗽 USA",
      theme: 'usa',
      bgColor: "#1b1f3b",
      enemyKey: 'enemyRat',
      collectKey: 'dollar',
      platforms: [
        { x: 400, y: 580, count: 25 },
        { x: 200, y: 500, count: 3 },
        { x: 360, y: 440, count: 4 },
        { x: 560, y: 380, count: 4 },
        { x: 720, y: 320, count: 2 }
      ],
      enemies: [
        { x: 300, y: 540, range: 90 }, { x: 520, y: 540, range: 110 },
        { x: 360, y: 400, range: 70 }
      ],
      coins: [
        { x: 200, y: 460 }, { x: 230, y: 460 }, { x: 360, y: 400 },
        { x: 560, y: 340 }, { x: 720, y: 280 }
      ],
      goalX: 760
    },
    // 7. Italy – Venice
    {
      name: "🇮🇹 ITALY",
      theme: 'italy',
      bgColor: "#2e6f40",
      enemyKey: 'enemyGondolier',
      collectKey: 'pizza',
      platforms: [
        { x: 400, y: 580, count: 25 },
        { x: 160, y: 500, count: 3 },
        { x: 360, y: 440, count: 4 },
        { x: 560, y: 380, count: 3 },
        { x: 300, y: 300, count: 3 }
      ],
      enemies: [
        { x: 260, y: 540, range: 90 }, { x: 480, y: 540, range: 110 },
        { x: 360, y: 400, range: 70 }
      ],
      coins: [
        { x: 160, y: 460 }, { x: 360, y: 400 }, { x: 560, y: 340 },
        { x: 300, y: 260 }
      ],
      goalX: 760
    },
    // 8. India – Taj Mahal / deserts
    {
      name: "🇮🇳 INDIA",
      theme: 'india',
      bgColor: "#b35e00",
      enemyKey: 'enemyElephant',
      collectKey: 'spice',
      platforms: [
        { x: 400, y: 580, count: 25 },
        { x: 140, y: 500, count: 3 },
        { x: 340, y: 440, count: 4 },
        { x: 540, y: 380, count: 3 },
        { x: 740, y: 320, count: 2 }
      ],
      enemies: [
        { x: 240, y: 540, range: 90 }, { x: 480, y: 540, range: 110 }
      ],
      coins: [
        { x: 140, y: 460 }, { x: 340, y: 400 }, { x: 540, y: 340 }, { x: 740, y: 280 }
      ],
      goalX: 760
    },
    // 9. Australia – Outback
    {
      name: "🇦🇺 AUSTRALIA",
      theme: 'australia',
      bgColor: "#c1691f",
      enemyKey: 'enemyKangaroo',
      collectKey: 'boomerang',
      platforms: [
        { x: 400, y: 580, count: 25 },
        { x: 200, y: 500, count: 3 },
        { x: 420, y: 440, count: 4 },
        { x: 620, y: 380, count: 3 }
      ],
      enemies: [
        { x: 300, y: 540, range: 100 }, { x: 520, y: 540, range: 100 }
      ],
      coins: [
        { x: 200, y: 460 }, { x: 420, y: 400 }, { x: 620, y: 340 }
      ],
      goalX: 760
    },
    // 10. Scotland (final) – Castle, festival
    {
      name: "🏰 SCOTLAND FINALE",
      theme: 'scotland_final',
      bgColor: "#263238",
      enemyKey: 'enemyWarrior',
      collectKey: 'trophy',
      platforms: [
        { x: 400, y: 580, count: 25 },
        { x: 220, y: 480, count: 4 },
        { x: 420, y: 410, count: 4 },
        { x: 600, y: 340, count: 3 },
        { x: 320, y: 270, count: 3 }
      ],
      enemies: [
        { x: 300, y: 540, range: 120 }, { x: 520, y: 540, range: 120 }, { x: 420, y: 370, range: 80 }
      ],
      coins: [
        { x: 220, y: 440 }, { x: 420, y: 370 }, { x: 600, y: 300 }, { x: 320, y: 230 }
      ],
      goalX: 760
    }
  ];
/* =========================
   GAME SCENE
========================= */

class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  init(data) {
    this.currentLevel = data.level || 0;
    this.score = data.score || 0;
    this.lives = data.lives || LIVES_START;
  }

  preload() {
    generateRetroAssets(this);
    // Load gameplay music
    this.load.audio('gameMusic', '/audio/title-music.mp3');
  }

  create() {
    this.retroSound = new RetroSound();
    this.cursors = this.input.keyboard.createCursorKeys();
    this.cursors.space = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    const levelData = LEVELS[this.currentLevel % LEVELS.length];

    // Set background color for world theme
    this.cameras.main.setBackgroundColor(levelData.bgColor);

    // Play game music (only if asset exists)
    try {
      if (this.cache.audio && this.cache.audio.exists('gameMusic')) {
        if (!this.sound.get('gameMusic')) {
          const prefs = AudioPrefs.load();
          this.sound.mute = !!prefs.muted;
          this.sound.volume = prefs.volume;
          const gameMusic = this.sound.add('gameMusic', { loop: true, volume: prefs.volume });
          gameMusic.play();
        }
      } else {
        console.log('[GameScene] gameMusic not found, skipping audio');
      }
    } catch (e) {
      console.warn('[GameScene] Unable to start music:', e.message);
    }

    // Audio UI (mute toggle)
    this.createAudioToggle();

    this.platforms = this.physics.add.staticGroup();
    
    levelData.platforms.forEach(p => {
      for (let i = 0; i < p.count; i++) {
        const tile = this.add.sprite(p.x + i * 32, p.y, "ground");
        this.physics.add.existing(tile, true);
        this.platforms.add(tile);
      }
    });

    this.player = new Player(this, 50, 500);
    this.player.canFly = false;
    this.physics.add.collider(this.player.sprite, this.platforms);

    // Player accessory per theme
    const accMap = {
      scotland: 'acc_scotland', japan: 'acc_japan', egypt: 'acc_egypt', brazil: 'acc_brazil',
      france: 'acc_france', usa: 'acc_usa', italy: 'acc_italy', india: 'acc_india',
      australia: 'acc_australia', scotland_final: 'acc_scotland_final'
    };
    const accKey = accMap[levelData.theme] || 'acc_scotland';
    this.playerAcc = this.add.sprite(this.player.sprite.x, this.player.sprite.y - 16, accKey).setDepth(10);
    this.playerAcc.setScrollFactor(1);

    this.enemies = [];
    levelData.enemies.forEach(e => {
      const enemy = new Enemy(this, e.x, e.y, e.range);
      if (levelData.enemyKey) enemy.sprite.setTexture(levelData.enemyKey);
      this.enemies.push(enemy);
      this.physics.add.collider(enemy.sprite, this.platforms);
      this.tweens.add({ targets: enemy.sprite, scaleY: 1.1, duration: 600, yoyo: true, repeat: -1 });
    });

    this.coins = this.physics.add.staticGroup();
    levelData.coins.forEach(c => {
      const key = levelData.collectKey || 'coin';
      const coin = this.add.sprite(c.x, c.y, key);
      this.physics.add.existing(coin, true);
      this.coins.add(coin);
    });
    // Floaty collectible animation
    this.coins.children.iterate((child) => {
      if (child) this.tweens.add({ targets: child, y: child.y - 6, duration: 800, yoyo: true, repeat: -1 });
    });

    this.goal = this.physics.add.staticSprite(levelData.goalX, 532, "flagScotland");

    this.physics.add.overlap(this.player.sprite, this.coins, (player, coin) => {
      coin.destroy();
      this.score += 100;
      this.retroSound.play('coin');
      this.updateUI();
    });

    this.physics.add.overlap(this.player.sprite, this.goal, () => {
      this.completeLevel();
    });

    this.enemies.forEach(enemy => {
      this.physics.add.overlap(this.player.sprite, enemy.sprite, (player, enemySprite) => {
        if (player.body.velocity.y > 100 && player.y < enemySprite.y - 5) {
          enemy.die();
          player.body.velocity.y = -200;
          this.score += 50;
          this.retroSound.play('coin');
          this.updateUI();
        } else {
          this.player.die();
        }
      });
    });

    this.scoreText = this.add.text(16, 16, `SCORE: ${this.score}`, {
      font: "16px monospace",
      color: "#ffffff"
    }).setScrollFactor(0);

    this.livesText = this.add.text(GAME_WIDTH - 120, 16, `LIVES: ${this.lives}`, {
      font: "16px monospace",
      color: "#ffffff"
    }).setScrollFactor(0);

    this.levelText = this.add.text(GAME_WIDTH / 2, 16, levelData.name, {
      font: "16px monospace",
      color: "#ffdd00"
    }).setOrigin(0.5).setScrollFactor(0);

    // Level intro banner
    const intro = this.add.container(GAME_WIDTH/2, GAME_HEIGHT/2 - 120).setScrollFactor(0);
    const bg = this.add.rectangle(0, 0, 420, 64, 0x000000, 0.6).setStrokeStyle(2, 0xffffff);
    const tx = this.add.text(0, 0, levelData.name, { font: '20px monospace', color: '#ffea00' }).setOrigin(0.5);
    intro.add([bg, tx]);
    this.tweens.add({ targets: intro, alpha: 0, duration: 1400, delay: 700, onComplete: () => intro.destroy() });

    // Progress bar HUD
    this.progBg = this.add.rectangle(GAME_WIDTH/2, 12, 240, 8, 0x000000, 0.35).setScrollFactor(0);
    this.progFill = this.add.rectangle(GAME_WIDTH/2 - 120, 12, 0, 8, 0xffea00, 0.9).setOrigin(0, 0.5).setScrollFactor(0);

    // Parallax background layers
    this.parallaxFar = this.add.tileSprite(0, 260, GAME_WIDTH, 120, 'mountainFar').setOrigin(0).setScrollFactor(0);
    this.parallaxNear = this.add.tileSprite(0, 320, GAME_WIDTH, 160, 'mountainNear').setOrigin(0).setScrollFactor(0.2);
    // Theme-based tinting
    const themeIndex = this.currentLevel % LEVELS.length;
    const themeTints = [0xffffff, 0xffc0cb, 0xffe4a1, 0xb0ffcf, 0xb0d8ff];
    const tint = themeTints[themeIndex] || 0xffffff;
    this.parallaxFar.setTint(tint);
    this.parallaxNear.setTint(tint);

    this.backgroundLayer = this.add.layer();
    for (let i = 0; i < 8; i++) {
      const flower = this.add.sprite(Phaser.Math.Between(50, 750), Phaser.Math.Between(50, 550), 'coin');
      flower.setAlpha(0.3);
      flower.setScale(0.4);
      flower.setTint(0x9b59b6);
      this.backgroundLayer.add(flower);
    }
    // Theme decor specific shapes
    this.addThemeDecor(levelData);
    
    this.clouds = this.add.group();
    for (let i = 0; i < 4; i++) {
      const cloud = this.add.rectangle(Phaser.Math.Between(0, 800), Phaser.Math.Between(50, 150), 100, 40, 0xffffff, 0.15);
      this.clouds.add(cloud);
    }
    
    // Power-ups: wing (double jump) + spring (high jump)
    this.powerUps = this.physics.add.group();
    const addPowerUp = (type, tint) => {
      const x = Phaser.Math.Between(100, 700);
      const y = Phaser.Math.Between(160, 420);
      const key = type === 'wing' ? 'powerWing' : 'powerSpring';
      const pu = this.add.sprite(x, y, key);
      pu.setTint(tint);
      pu.setScale(0.7);
      pu.setData('type', type);
      this.physics.add.existing(pu);
      this.powerUps.add(pu);
    };
    addPowerUp('wing', 0xffaa66);   // orange = double jump
    addPowerUp('spring', 0x66ff66); // green = high jump

    // HUD for power-up durations
    this.powerHud = this.add.container(GAME_WIDTH - 20, 46).setScrollFactor(0);
    this.powerHud.setDepth(10);
    this.powerHud.setVisible(true);
    this.hudWingIcon = this.add.sprite(0, 0, 'powerWing').setOrigin(1, 0).setScale(1).setVisible(false);
    this.hudWingText = this.add.text(-18, 2, '', { font: '12px monospace', color: '#ffffff' }).setOrigin(1, 0).setVisible(false);
    this.hudSpringIcon = this.add.sprite(0, 22, 'powerSpring').setOrigin(1, 0).setScale(1).setVisible(false);
    this.hudSpringText = this.add.text(-18, 24, '', { font: '12px monospace', color: '#ffffff' }).setOrigin(1, 0).setVisible(false);
    this.powerHud.add([this.hudWingIcon, this.hudWingText, this.hudSpringIcon, this.hudSpringText]);
    this.powerExpire = { wing: 0, spring: 0 };

    this.physics.add.overlap(this.player.sprite, this.powerUps, (player, powerUp) => {
      const type = powerUp.getData('type');
      this.retroSound.play('coin');
      if (type === 'wing') {
        this.player.hasDoubleJump = true;
        this.powerExpire.wing = this.time.now + 7000;
        this.hudWingIcon.setVisible(true);
        this.hudWingText.setVisible(true);
        this.time.delayedCall(7000, () => { this.player.hasDoubleJump = false; this.hudWingIcon.setVisible(false); this.hudWingText.setVisible(false); });
      } else if (type === 'spring') {
        this.player.jumpBoost = 1.4;
        this.powerExpire.spring = this.time.now + 7000;
        this.hudSpringIcon.setVisible(true);
        this.hudSpringText.setVisible(true);
        this.time.delayedCall(7000, () => { this.player.jumpBoost = 1; this.hudSpringIcon.setVisible(false); this.hudSpringText.setVisible(false); });
      }
      powerUp.destroy();
    });

    // Add some flying enemies
    this.flyingEnemies = [];
    for (let i = 0; i < 2; i++) {
      const bat = new FlyingEnemy(this, Phaser.Math.Between(80, 720), Phaser.Math.Between(140, 280));
      if (levelData.enemyKey) bat.sprite.setTexture(levelData.enemyKey);
      this.flyingEnemies.push(bat);
      this.physics.add.overlap(this.player.sprite, bat.sprite, () => this.player.die());
    }
    
    this.cameras.main.setBounds(0, 0, 800, 600);
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
  }

  update() {
    this.player.update();
    this.enemies.forEach(e => e.update());
    if (this.flyingEnemies) this.flyingEnemies.forEach(e => e.update());
    if (this.parallaxFar) this.parallaxFar.tilePositionX += 0.1;
    if (this.parallaxNear) this.parallaxNear.tilePositionX += 0.3;

    // Update HUD countdowns
    if (this.powerExpire) {
      const now = this.time.now;
      if (this.powerExpire.wing > now) {
        const s = Math.max(0, Math.ceil((this.powerExpire.wing - now) / 1000));
        this.hudWingText.setText(s + 's');
      }
      if (this.powerExpire.spring > now) {
        const s2 = Math.max(0, Math.ceil((this.powerExpire.spring - now) / 1000));
        this.hudSpringText.setText(s2 + 's');
      }
    }

    // Accessory follows player
    if (this.playerAcc) {
      this.playerAcc.x = this.player.sprite.x + (this.player.sprite.flipX ? -1 : 1) * 0;
      this.playerAcc.y = this.player.sprite.y - 18;
      this.playerAcc.scaleX = this.player.sprite.flipX ? -1 : 1;
    }

    // Update progress bar based on player x vs. goal
    if (this.progFill && this.goal) {
      const progress = Math.max(0, Math.min(1, this.player.sprite.x / this.goal.x));
      this.progFill.width = 240 * progress;
    }

    if (this.player.sprite.y > 650) {
      this.player.die();
    }
  }

  updateUI() {
    this.scoreText.setText(`SCORE: ${this.score}`);
    this.livesText.setText(`LIVES: ${this.lives}`);
  }

  completeLevel() {
    this.retroSound.play('clear');
    this.score += 500;
    
    const phrase = Phaser.Math.RND.pick(COMPLETION_PHRASES);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, phrase, {
      font: "24px monospace",
      color: "#ffff00"
    }).setOrigin(0.5).setScrollFactor(0);

    this.time.delayedCall(1500, () => {
      this.currentLevel += 1;
      
      if (this.currentLevel >= LEVELS.length) {
        this.currentLevel = 0;
        this.lives += 1;
      }

      this.scene.restart({
        level: this.currentLevel,
        score: this.score,
        lives: this.lives
      });
    });
  }

  gameOver() {
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7)
      .setOrigin(0).setScrollFactor(0);
    
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30, "GAME OVER", {
      font: "32px monospace",
      color: "#ff0000"
    }).setOrigin(0.5).setScrollFactor(0);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, "Canny Beat it.", {
      font: "20px monospace",
      color: "#ffdd00"
    }).setOrigin(0.5).setScrollFactor(0);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, `FINAL SCORE: ${this.score}`, {
      font: "20px monospace",
      color: "#ffffff"
    }).setOrigin(0.5).setScrollFactor(0);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, "PRESS ENTER TO RESTART", {
      font: "16px monospace",
      color: "#cccccc"
    }).setOrigin(0.5).setScrollFactor(0);

    this.input.keyboard.once("keydown-ENTER", () => {
      this.scene.restart({ level: 0, score: 0, lives: LIVES_START });
    });
  }

  createAudioToggle() {
    const prefs = AudioPrefs.load();
    const icon = () => (this.sound.mute ? '🔇' : '🔊');
    const text = this.add.text(GAME_WIDTH - 18, 16, icon(), { font: '18px monospace', color: '#ffffff' })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });
    const toggle = () => {
      this.sound.mute = !this.sound.mute;
      text.setText(icon());
      AudioPrefs.save({ muted: this.sound.mute, volume: this.sound.volume });
    };
    text.on('pointerdown', toggle);

    // Simple volume controls
    const minus = this.add.text(GAME_WIDTH - 64, 18, '−', { font: '16px monospace', color: '#ffffff' })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });
    const plus = this.add.text(GAME_WIDTH - 34, 18, '+', { font: '16px monospace', color: '#ffffff' })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });
    const clamp = (v) => Math.min(1, Math.max(0, v));
    minus.on('pointerdown', () => {
      this.sound.volume = clamp((this.sound.volume ?? prefs.volume) - 0.1);
      AudioPrefs.save({ muted: this.sound.mute, volume: this.sound.volume });
    });
    plus.on('pointerdown', () => {
      this.sound.volume = clamp((this.sound.volume ?? prefs.volume) + 0.1);
      AudioPrefs.save({ muted: this.sound.mute, volume: this.sound.volume });
    });
  }

  addThemeDecor(levelData) {
    const g = this.add.graphics();
    g.setScrollFactor(0);
    const th = levelData.theme;
    if (th === 'scotland' || th === 'scotland_final') {
      g.fillStyle(0x2e4053, 1);
      for (let i = 0; i < 4; i++) {
        const bx = 80 + i * 180;
        g.fillTriangle(bx, 360, bx + 40, 260, bx + 80, 360);
        g.fillStyle(0x1c2833, 1);
        g.fillRect(bx + 30, 360, 20, 10);
      }
      if (th === 'scotland_final') {
        g.fillStyle(0x444444, 1);
        g.fillRect(600, 240, 80, 80);
        g.fillRect(590, 260, 10, 60);
        g.fillRect(680, 260, 10, 60);
      }
    } else if (th === 'japan') {
      g.fillStyle(0xffc0cb, 1);
      for (let i = 0; i < 5; i++) g.fillCircle(100 + i * 140, 120 + (i % 2) * 20, 18);
      g.fillStyle(0x8b0000, 1);
      g.fillRect(360, 220, 20, 80);
      g.fillRect(330, 220, 80, 10);
      g.fillRect(340, 200, 60, 10);
    } else if (th === 'egypt') {
      g.fillStyle(0xc2b280, 1);
      g.fillTriangle(120, 360, 200, 200, 280, 360);
      g.fillTriangle(300, 360, 380, 220, 460, 360);
      g.fillStyle(0x3fa7d6, 0.6);
      g.fillRect(0, 400, GAME_WIDTH, 20);
    } else if (th === 'brazil') {
      g.fillStyle(0x006400, 1);
      for (let i = 0; i < 6; i++) g.fillRect(60 + i * 120, 260, 20, 100);
      g.fillStyle(0x228b22, 1);
      for (let i = 0; i < 6; i++) g.fillCircle(70 + i * 120, 240, 30);
    } else if (th === 'france') {
      g.fillStyle(0x2c3e50, 1);
      for (let i = 0; i < 6; i++) g.fillRect(40 + i * 120, 300 - (i % 3) * 20, 60, 120);
      g.fillStyle(0xaaaaaa, 1);
      g.fillRect(520, 220, 10, 160);
      g.fillRect(500, 240, 50, 10);
    } else if (th === 'usa') {
      g.fillStyle(0x34495e, 1);
      for (let i = 0; i < 8; i++) g.fillRect(50 + i * 90, 260, 40, 140);
    } else if (th === 'italy') {
      g.fillStyle(0x87ceeb, 0.6);
      for (let i = 0; i < 4; i++) g.fillRect(120 + i * 150, 360, 60, 6);
      g.fillStyle(0xffe4b5, 1);
      for (let i = 0; i < 4; i++) g.fillRect(100 + i * 150, 320, 80, 40);
    } else if (th === 'india') {
      g.fillStyle(0xffffff, 1);
      g.fillRect(560, 230, 80, 60);
      g.fillRect(540, 260, 120, 10);
      g.fillCircle(600, 260, 8);
    } else if (th === 'australia') {
      g.fillStyle(0xffe4a1, 1);
      g.fillRect(0, 360, GAME_WIDTH, 30);
      g.fillStyle(0x87ceeb, 1);
      g.fillRect(0, 420, GAME_WIDTH, 10);
    }
  }
}

/* =========================
   TITLE SCENE
========================= */

class TitleScene extends Phaser.Scene {
  constructor() {
    super("TitleScene");
  }

  preload() {
    // Load the welcome screen image (optional)
    this.load.image('welcomeScreen', '/welcome-screen.png');
    // Load title music
    this.load.audio('titleMusic', '/audio/title-music.mp3');
    this.load.on('loaderror', () => {
      console.log('Welcome screen image not found, using fallback');
    });
  }

  create() {
    // Draw retro platformer welcome screen
    const graphics = this.add.graphics();
    
    // Sky (light blue)
    graphics.fillStyle(0x6eb5ff, 1);
    graphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT * 0.6);
    
    // Clouds
    const drawCloud = (x, y) => {
      graphics.fillStyle(0xffffff, 0.9);
      graphics.fillRect(x, y, 30, 15);
      graphics.fillRect(x + 20, y - 5, 40, 15);
      graphics.fillRect(x + 50, y, 30, 15);
    };
    drawCloud(50, 40);
    drawCloud(240, 60);
    drawCloud(480, 50);
    drawCloud(650, 35);
    
    // Grass area (green)
    graphics.fillStyle(0x00aa00, 1);
    graphics.fillRect(0, GAME_HEIGHT * 0.6 - 20, GAME_WIDTH, 20);
    
    // Dirt (brown)
    graphics.fillStyle(0x6b4423, 1);
    graphics.fillRect(0, GAME_HEIGHT * 0.6, GAME_WIDTH, GAME_HEIGHT * 0.4);
    
    // Left tree trunk
    graphics.fillStyle(0x654321, 1);
    graphics.fillRect(30, GAME_HEIGHT * 0.5 - 50, 20, 60);
    // Left tree foliage
    graphics.fillStyle(0x00aa00, 1);
    graphics.fillRect(10, GAME_HEIGHT * 0.5 - 70, 60, 40);
    
    // Right tree trunk
    graphics.fillRect(GAME_WIDTH - 50, GAME_HEIGHT * 0.5 - 50, 20, 60);
    // Right tree foliage
    graphics.fillRect(GAME_WIDTH - 70, GAME_HEIGHT * 0.5 - 70, 60, 40);

    // Main title (bigger, bolder, retro font)
    const titleLine1 = this.add.text(GAME_WIDTH / 2, 110, "ZAIN'S", {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "48px",
      color: "#ffea00",
      align: "center",
      stroke: "#2b2b5f",
      strokeThickness: 8
    }).setOrigin(0.5).setShadow(0, 6, "#000000", 6, true, true);

    const titleLine2 = this.add.text(GAME_WIDTH / 2, 175, "TRAVEL HOP", {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "68px",
      color: "#ffea00",
      align: "center",
      stroke: "#2b2b5f",
      strokeThickness: 8
    }).setOrigin(0.5).setShadow(0, 6, "#000000", 6, true, true);

    // Start button
    const buttonX = GAME_WIDTH / 2;
    const buttonY = GAME_HEIGHT / 2 + 40;
    
    // Button background
    graphics.fillStyle(0x333333, 1);
    graphics.fillRect(buttonX - 80, buttonY - 20, 160, 40);
    graphics.fillStyle(0xffffff, 1);
    graphics.strokeRect(buttonX - 80, buttonY - 20, 160, 40);

    this.add.text(buttonX, buttonY, "START GAME", {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "20px",
      color: "#ffea00",
      stroke: "#001a66",
      strokeThickness: 4
    }).setOrigin(0.5);

    // Blinking start text
    const startText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 60, "PRESS ANY KEY OR CLICK", {
      font: "16px Arial, sans-serif",
      color: "#ffffff"
    }).setOrigin(0.5);

    this.tweens.add({
      targets: startText,
      alpha: 0.3,
      duration: 600,
      yoyo: true,
      repeat: -1
    });

    // Play title music (only if asset exists)
    try {
      if (this.cache.audio && this.cache.audio.exists('titleMusic')) {
        if (!this.sound.get('titleMusic')) {
          const prefs = AudioPrefs.load();
          this.sound.mute = !!prefs.muted;
          this.sound.volume = prefs.volume;
          const titleMusic = this.sound.add('titleMusic', { loop: true, volume: prefs.volume });
          titleMusic.play();
        }
      } else {
        console.log('[TitleScene] titleMusic not found, skipping audio');
      }
    } catch (e) {
      console.warn('[TitleScene] Unable to start music:', e.message);
    }

    // Audio UI (mute toggle)
    this.createAudioToggle();

    // Start game function
    const startGame = () => {
      // ensure any title music stops before switching
      try { this.sound.stopAll(); } catch {}
      this.scene.start("GameScene", { level: 0, score: 0, lives: LIVES_START });
    };

    // Start with ANY key press
    this.input.keyboard.on("keydown", startGame);

    // Start with mouse click anywhere
    this.input.on("pointerdown", startGame);
    
    // Also make canvas interactive
    this.input.setDefaultCursor('pointer');
  }

  createAudioToggle() {
    const icon = () => (this.sound.mute ? '🔇' : '🔊');
    const text = this.add.text(GAME_WIDTH - 18, 16, icon(), { font: '18px monospace', color: '#ffffff' })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true });
    const toggle = () => {
      this.sound.mute = !this.sound.mute;
      text.setText(icon());
      AudioPrefs.save({ muted: this.sound.mute, volume: this.sound.volume });
    };
    text.on('pointerdown', toggle);

    // Simple volume controls
    const prefs = AudioPrefs.load();
    const minus = this.add.text(GAME_WIDTH - 64, 18, '−', { font: '16px monospace', color: '#ffffff' })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true });
    const plus = this.add.text(GAME_WIDTH - 34, 18, '+', { font: '16px monospace', color: '#ffffff' })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true });
    const clamp = (v) => Math.min(1, Math.max(0, v));
    minus.on('pointerdown', () => {
      this.sound.volume = clamp((this.sound.volume ?? prefs.volume) - 0.1);
      AudioPrefs.save({ muted: this.sound.mute, volume: this.sound.volume });
    });
    plus.on('pointerdown', () => {
      this.sound.volume = clamp((this.sound.volume ?? prefs.volume) + 0.1);
      AudioPrefs.save({ muted: this.sound.mute, volume: this.sound.volume });
    });
  }
}

/* =========================
   REACT COMPONENT
========================= */

export default function MiniGameContainer(){
  const containerRef = useRef(null);
  const gameRef = useRef(null);
  const navigate = useNavigate();
  const [showOverlay, setShowOverlay] = React.useState(true);

  useEffect(() => {
    // Wait for DOM to be ready
    if (!containerRef.current) return;
    
    // Prevent double initialization
    if (gameRef.current) {
      return () => {};
    }
    // Load retro web font for title
    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
    document.head.appendChild(fontLink);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const config = {
      type: Phaser.AUTO,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      parent: containerRef.current,
      backgroundColor: "#1a1a2e",
      pixelArt: true,
      physics: {
        default: "arcade",
        arcade: {
          gravity: { y: 0 },
          debug: false
        }
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: GAME_WIDTH,
        height: GAME_HEIGHT
      },
      scene: [TitleScene, GameScene]
    };
    
    try {
      const game = new Phaser.Game(config);
      gameRef.current = game;
      console.log('✅ Game initialized successfully');
    } catch (err) {
      console.error('❌ Game initialization error:', err);
    }

    // Prevent arrow keys from scrolling
    const preventScroll = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.key)) {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', preventScroll, { passive: false });

    const escListener = (e) => {
      if (e.key === "Escape") {
        handleExit();
      }
    };
    window.addEventListener("keydown", escListener);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", preventScroll);
      window.removeEventListener("keydown", escListener);
      if (fontLink && fontLink.parentNode) {
        try { document.head.removeChild(fontLink); } catch {}
      }
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      if (gameRef.current) {
        try { 
          gameRef.current.destroy(true); 
          gameRef.current = null;
        } catch(e) {
          console.warn('Error destroying game:', e);
        }
      }
    };
  }, []);

  const handleStart = () => {
    // Enter fullscreen
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
    
    // Hide overlay
    setShowOverlay(false);
    
    // Focus game canvas after a brief delay
    setTimeout(() => {
      const canvas = document.querySelector('#game-container canvas');
      if (canvas) {
        canvas.focus();
        canvas.click(); // Ensure Phaser receives focus
      }
    }, 100);
  };

  const handleExit = () => {
    // Exit fullscreen
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    // Navigate to home immediately
    navigate('/');
  };

  return (
    <>
      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
      <div 
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw', 
          height: '100vh', 
          overflow: 'hidden', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          background: '#0a0a0a',
          zIndex: 9999
        }}
      >
      {showOverlay && (
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            cursor: 'pointer'
          }}
          onClick={handleStart}
        >
          <div style={{ fontSize: 48, marginBottom: 20 }}>🎮</div>
          <div style={{ fontSize: 32, color: '#ffdd00', fontFamily: 'monospace', marginBottom: 20 }}>
            ZAIN'S TRAVEL HOP
          </div>
          <div style={{ fontSize: 18, color: '#ffffff', fontFamily: 'monospace' }}>
            CLICK TO START FULLSCREEN
          </div>
        </div>
      )}
      {!showOverlay && (
        <button
          onClick={handleExit}
          style={{
            position: 'absolute',
            top: 24,
            right: 24,
            zIndex: 10000,
            background: 'rgba(15, 17, 22, 0.85)',
            color: '#f5f7fb',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '12px',
            padding: '14px 28px',
            fontSize: '14px',
            fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
            animation: 'fadeIn 0.6s ease-in-out',
            letterSpacing: '0.5px'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(15, 17, 22, 0.95)';
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(15, 17, 22, 0.85)';
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.4)';
          }}
        >
          <span style={{ fontSize: '16px' }}>←</span>
          RETURN TO HOMEPAGE
        </button>
      )}
      <div 
        id="game-container" 
        ref={containerRef}
        style={{ 
          overflow: 'hidden', 
          width: '100%', 
          height: '100%' 
        }}
      />
      </div>
    </>
  );
}
