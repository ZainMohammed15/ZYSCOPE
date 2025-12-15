import { useState, useEffect } from 'react';
import { audio } from '../utils/audioSystem';
import './Assistant.css';

export default function Assistant() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [tips, setTips] = useState([]);
  const [currentTip, setCurrentTip] = useState(0);

  const gameTips = [
    "🗺️ Click markers on the map to mark countries as visited!",
    "⭐ Earn XP by visiting countries and writing reviews",
    "🏆 Unlock badges at 5, 10, 25, 50, and 100 countries",
    "🎯 Check the Leaderboard to see top explorers",
    "📊 Compare countries to find your next adventure",
    "🔍 Use search to quickly find specific countries",
    "⌨️ Use arrow keys to navigate the map",
    "💬 Share your experiences by reviewing countries",
    "🎨 Customize your profile with avatar and nickname",
    "🔊 Toggle sound effects in settings"
  ];

  useEffect(() => {
    setTips(gameTips);
    
    // Show assistant after 3 seconds on first visit
    const timer = setTimeout(() => {
      if (!localStorage.getItem('assistant_seen')) {
        show("Welcome to ZYSCOPE! 🌍 I'm your travel companion. Click markers to start exploring!");
        localStorage.setItem('assistant_seen', 'true');
      }
    }, 3000);

    // Listen for custom events
    window.addEventListener('assistant:show', handleShow);
    window.addEventListener('zyscope:visited', handleVisited);
    window.addEventListener('achievement:unlock', handleAchievement);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('assistant:show', handleShow);
      window.removeEventListener('zyscope:visited', handleVisited);
      window.removeEventListener('achievement:unlock', handleAchievement);
    };
  }, []);

  const handleShow = (e) => {
    if (e.detail?.message) {
      show(e.detail.message);
    }
  };

  const handleVisited = () => {
    const visitCount = parseInt(localStorage.getItem('visit_count') || '0') + 1;
    localStorage.setItem('visit_count', visitCount);

    if (visitCount === 1) {
      show("Great start! 🎉 Keep exploring to earn XP and unlock achievements!");
    } else if (visitCount === 5) {
      show("🏆 First milestone unlocked! You're on fire!");
    } else if (visitCount % 10 === 0) {
      show(`🌟 Amazing! ${visitCount} countries visited! You're a true explorer!`);
    }
  };

  const handleAchievement = (e) => {
    if (e.detail?.name) {
      show(`🎊 Achievement Unlocked: ${e.detail.name}!`);
      audio.achievement();
    }
  };

  const show = (msg) => {
    setMessage(msg);
    setVisible(true);
    audio.notification();
    
    setTimeout(() => {
      setVisible(false);
    }, 5000);
  };

  const nextTip = () => {
    const next = (currentTip + 1) % tips.length;
    setCurrentTip(next);
    setMessage(tips[next]);
    setVisible(true);
    audio.click();

    setTimeout(() => {
      setVisible(false);
    }, 5000);
  };

  const dismiss = () => {
    setVisible(false);
    audio.click();
  };

  return (
    <>
      <button 
        className="assistant-trigger"
        onClick={nextTip}
        title="Need help? Click for tips!"
        aria-label="Assistant"
      >
        <span className="assistant-icon">💡</span>
      </button>

      {visible && (
        <div className="assistant-popup">
          <div className="assistant-avatar">
            <div className="avatar-pulse"></div>
            <span className="avatar-emoji">🤖</span>
          </div>
          <div className="assistant-content">
            <p className="assistant-message">{message}</p>
            <button 
              className="assistant-dismiss"
              onClick={dismiss}
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}
