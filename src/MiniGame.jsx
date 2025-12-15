import React, { useEffect, useRef, useState } from 'react';
import { useUser } from './userContext';
import { post } from './utils/api';
import { audio } from './utils/audioSystem';

export default function MiniGame() {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('intro'); // intro, playing, paused, complete
  const [score, setScore] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [dailyXP, setDailyXP] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { user } = useUser();
  const gameRef = useRef(null);

  const MAX_DAILY_XP = 200;

  useEffect(() => {
    audio.playPageLoad();
    // Load daily XP from localStorage
    const today = new Date().toDateString();
    const stored = localStorage.getItem('weatherscot_daily_xp');
    if (stored) {
      const data = JSON.parse(stored);
      if (data.date === today) {
        setDailyXP(data.xp);
      } else {
        localStorage.setItem('weatherscot_daily_xp', JSON.stringify({ date: today, xp: 0 }));
      }
    }
  }, []);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 400;

    // Game variables
    const game = {
      player: {
        x: 100,
        y: 300,
        width: 32,
        height: 32,
        velocityY: 0,
        velocityX: 0,
        onGround: false,
        frame: 0,
        direction: 1,
      },
      gravity: 0.5,
      jumpPower: -12,
      moveSpeed: 5,
      coins: [],
      obstacles: [],
      weather: 'clear', // clear, rain, wind, fog
      weatherTimer: 0,
      cameraX: 0,
      score: 0,
      running: true,
      keys: {},
    };

    gameRef.current = game;

    // Generate initial coins
    for (let i = 0; i < 20; i++) {
      game.coins.push({
        x: 200 + i * 150 + Math.random() * 100,
        y: 150 + Math.random() * 100,
        collected: false,
      });
    }

    // Generate obstacles
    for (let i = 0; i < 10; i++) {
      game.obstacles.push({
        x: 300 + i * 200,
        y: 340,
        width: 60,
        height: 40,
      });
    }

    // Keyboard handling
    const handleKeyDown = (e) => {
      game.keys[e.key] = true;
      if (e.key === ' ' && game.player.onGround) {
        game.player.velocityY = game.jumpPower;
        game.player.onGround = false;
        if (soundEnabled) playJumpSound();
      }
      if (e.key === 'Escape') {
        setGameState('paused');
      }
    };

    const handleKeyUp = (e) => {
      game.keys[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Game loop
    const gameLoop = () => {
      if (!game.running) return;

      // Clear canvas
      ctx.fillStyle = '#87CEEB';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw mountains background
      ctx.fillStyle = '#5a4a3a';
      ctx.beginPath();
      ctx.moveTo(0, 250);
      ctx.lineTo(200, 150);
      ctx.lineTo(400, 200);
      ctx.lineTo(600, 120);
      ctx.lineTo(800, 180);
      ctx.lineTo(800, 400);
      ctx.lineTo(0, 400);
      ctx.fill();

      // Draw hills
      ctx.fillStyle = '#6b8e23';
      ctx.beginPath();
      ctx.moveTo(0, 300);
      ctx.bezierCurveTo(200, 250, 400, 280, 600, 270);
      ctx.lineTo(800, 270);
      ctx.lineTo(800, 400);
      ctx.lineTo(0, 400);
      ctx.fill();

      // Draw ground
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(0, 370, canvas.width, 30);

      // Update weather
      game.weatherTimer++;
      if (game.weatherTimer > 500) {
        const weathers = ['clear', 'rain', 'wind', 'fog'];
        game.weather = weathers[Math.floor(Math.random() * weathers.length)];
        game.weatherTimer = 0;
      }

      // Draw weather effects
      if (game.weather === 'rain') {
        ctx.strokeStyle = 'rgba(200, 200, 255, 0.5)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 50; i++) {
          const x = Math.random() * canvas.width;
          const y = (Math.random() * canvas.height + game.weatherTimer * 5) % canvas.height;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x - 2, y + 10);
          ctx.stroke();
        }
      }

      if (game.weather === 'fog') {
        ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Player input
      if (game.keys['ArrowLeft']) {
        game.player.velocityX = -game.moveSpeed;
        game.player.direction = -1;
      } else if (game.keys['ArrowRight']) {
        game.player.velocityX = game.moveSpeed;
        game.player.direction = 1;
      } else {
        game.player.velocityX = 0;
      }

      // Apply wind effect
      if (game.weather === 'wind' && !game.player.onGround) {
        game.player.velocityX += 2;
      }

      // Apply rain friction
      if (game.weather === 'rain' && game.player.onGround) {
        game.player.velocityX *= 0.95;
      }

      // Update player
      game.player.velocityY += game.gravity;
      game.player.x += game.player.velocityX;
      game.player.y += game.player.velocityY;

      // Ground collision
      if (game.player.y + game.player.height >= 370) {
        game.player.y = 370 - game.player.height;
        game.player.velocityY = 0;
        game.player.onGround = true;
      } else {
        game.player.onGround = false;
      }

      // Keep player in bounds
      if (game.player.x < 0) game.player.x = 0;
      if (game.player.x > 3000) game.player.x = 3000;

      // Camera follow
      game.cameraX = game.player.x - 300;
      if (game.cameraX < 0) game.cameraX = 0;

      ctx.save();
      ctx.translate(-game.cameraX, 0);

      // Draw coins
      game.coins.forEach((coin) => {
        if (!coin.collected) {
          // Check collision
          if (
            game.player.x < coin.x + 20 &&
            game.player.x + game.player.width > coin.x &&
            game.player.y < coin.y + 20 &&
            game.player.y + game.player.height > coin.y
          ) {
            coin.collected = true;
            game.score += 10;
            setScore(game.score);
            if (soundEnabled) playCoinSound();
          }

          // Draw coin
          ctx.fillStyle = '#FFD700';
          ctx.beginPath();
          ctx.arc(coin.x + 10, coin.y + 10, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#DAA520';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });

      // Draw obstacles
      game.obstacles.forEach((obs) => {
        ctx.fillStyle = '#696969';
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
      });

      // Draw player (WeatherScot pixel art style)
      ctx.fillStyle = '#8B0000'; // Red tam
      ctx.fillRect(game.player.x + 8, game.player.y, 16, 8);
      
      ctx.fillStyle = '#FFD700'; // Scarf
      ctx.fillRect(game.player.x + 10, game.player.y + 8, 12, 4);
      
      ctx.fillStyle = '#FFA07A'; // Face
      ctx.fillRect(game.player.x + 10, game.player.y + 12, 12, 10);
      
      ctx.fillStyle = '#2F4F4F'; // Coat
      ctx.fillRect(game.player.x + 8, game.player.y + 22, 16, 10);
      
      ctx.fillStyle = '#8B4513'; // Legs/boots
      ctx.fillRect(game.player.x + 10, game.player.y + 32, 4, 8);
      ctx.fillRect(game.player.x + 18, game.player.y + 32, 4, 8);

      ctx.restore();

      // Draw UI
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(10, 10, 180, 60);
      ctx.fillStyle = '#FFD700';
      ctx.font = '16px monospace';
      ctx.fillText(`Score: ${game.score}`, 20, 30);
      ctx.fillText(`Weather: ${game.weather.toUpperCase()}`, 20, 50);

      // Check if game should end
      if (game.score >= 150) {
        endGame();
      }

      requestAnimationFrame(gameLoop);
    };

    gameLoop();

    const endGame = () => {
      game.running = false;
      const earnedXP = Math.min(game.score, MAX_DAILY_XP - dailyXP);
      setXpEarned(earnedXP);
      setGameState('complete');
      
      if (user && earnedXP > 0) {
        saveXP(earnedXP);
      }
      
      const today = new Date().toDateString();
      const newDailyXP = dailyXP + earnedXP;
      setDailyXP(newDailyXP);
      localStorage.setItem('weatherscot_daily_xp', JSON.stringify({ date: today, xp: newDailyXP }));
    };

    return () => {
      game.running = false;
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, soundEnabled, dailyXP, user]);

  const saveXP = async (xp) => {
    try {
      await post('/minigame/xp', { userId: user.id, xp });
    } catch (err) {
      console.error('Failed to save XP:', err);
    }
  };

  const playJumpSound = () => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.frequency.value = 400;
    oscillator.type = 'square';
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.1);
  };

  const playCoinSound = () => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.15);
  };

  const startGame = () => {
    audio.playClick();
    setGameState('playing');
    setScore(0);
  };

  const restartGame = () => {
    audio.playClick();
    setGameState('playing');
    setScore(0);
    setXpEarned(0);
  };

  return (
    <div className="app-shell">
      <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
        <h1 style={{ margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
          🎮 WeatherScot Mini-Game
        </h1>

        {gameState === 'intro' && (
          <div className="card" style={{ maxWidth: 600, padding: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 20 }}>🏔️</div>
            <h2 style={{ margin: '0 0 16px', color: 'var(--accent)' }}>The Highlands are restless…</h2>
            <p style={{ fontSize: 18, marginBottom: 24, color: 'var(--text)' }}>WeatherScot rises.</p>
            
            <div style={{ background: 'rgba(94, 240, 255, 0.1)', padding: 20, borderRadius: 10, marginBottom: 24 }}>
              <p style={{ margin: 0, lineHeight: 1.6 }}>
                This is a bonus challenge.<br />
                Earn XP. No pressure.
              </p>
            </div>

            <div style={{ background: 'var(--panel)', padding: 16, borderRadius: 10, marginBottom: 24, textAlign: 'left' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--accent)' }}>CONTROLS</h3>
              <div style={{ display: 'grid', gap: 8, fontSize: 13 }}>
                <div>⬅️ ➡️ Arrow keys → Move</div>
                <div>⬆️ Space → Jump</div>
                <div>ESC → Pause</div>
              </div>
            </div>

            <div style={{ marginBottom: 24, fontSize: 13, color: 'var(--muted)' }}>
              Daily XP cap: {dailyXP} / {MAX_DAILY_XP}
              {dailyXP >= MAX_DAILY_XP && <span style={{ color: 'var(--accent)', marginLeft: 8 }}>✓ Cap reached today!</span>}
            </div>

            <button
              onClick={startGame}
              onMouseEnter={() => audio.playHover()}
              style={{
                padding: '16px 32px',
                background: 'var(--accent)',
                color: '#0c1317',
                border: 'none',
                borderRadius: 10,
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'transform 200ms ease',
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              Press ENTER to begin
            </button>
          </div>
        )}

        {gameState === 'playing' && (
          <div style={{ position: 'relative' }}>
            <canvas
              ref={canvasRef}
              style={{
                border: '4px solid var(--border)',
                borderRadius: 10,
                background: '#87CEEB',
                imageRendering: 'pixelated',
              }}
            />
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              onMouseEnter={() => audio.playHover()}
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                padding: '8px 16px',
                background: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                border: '2px solid var(--border)',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 16,
              }}
            >
              {soundEnabled ? '🔊' : '🔇'}
            </button>
          </div>
        )}

        {gameState === 'complete' && (
          <div className="card" style={{ maxWidth: 600, padding: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 20 }}>⛰️</div>
            <h2 style={{ margin: '0 0 16px', color: 'var(--accent)' }}>Storm conquered.</h2>
            
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 48, fontWeight: 700, color: 'var(--accent)', marginBottom: 8 }}>
                {score}
              </div>
              <div style={{ color: 'var(--muted)' }}>Final Score</div>
            </div>

            <div style={{ background: 'rgba(255, 222, 47, 0.1)', padding: 20, borderRadius: 10, marginBottom: 24 }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--accent)', marginBottom: 8 }}>
                +{xpEarned} XP
              </div>
              <div style={{ fontSize: 14, color: 'var(--muted)' }}>
                Daily total: {dailyXP} / {MAX_DAILY_XP}
              </div>
            </div>

            <p style={{ marginBottom: 24, fontStyle: 'italic', color: 'var(--text)' }}>
              "The Highlands remember you."
            </p>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={restartGame}
                onMouseEnter={() => audio.playHover()}
                style={{
                  padding: '12px 24px',
                  background: 'var(--accent)',
                  color: '#0c1317',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Play Again
              </button>
              <button
                onClick={() => {
                  audio.playClick();
                  window.location.href = '/dashboard';
                }}
                onMouseEnter={() => audio.playHover()}
                style={{
                  padding: '12px 24px',
                  background: 'var(--panel)',
                  color: 'var(--text)',
                  border: '2px solid var(--border)',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
