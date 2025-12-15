import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../userContext';
import { audio } from '../utils/audioSystem';
import './SocialLogin.css';

export default function SocialLogin() {
  const [loading, setLoading] = useState(null);
  const { login } = useUser();
  const navigate = useNavigate();

  const handleSocialLogin = (provider) => {
    setLoading(provider);
    audio.click();
    
    // Create demo account with provider
    const demoUser = {
      id: Date.now(),
      username: `${provider}_${Math.random().toString(36).slice(2, 9)}`,
      email: `${provider}@demo.com`,
      avatar: getDefaultAvatar(provider),
      provider: provider
    };
    
    // Login immediately
    login(demoUser);
    audio.success();
    
    // Navigate to dashboard
    setTimeout(() => {
      navigate('/dashboard');
      setLoading(null);
    }, 300);
  };

  const getDefaultAvatar = (provider) => {
    const avatars = {
      google: 'https://www.google.com/favicon.ico',
      github: 'https://github.githubassets.com/favicons/favicon.png',
      discord: 'https://discord.com/assets/favicon.ico',
      facebook: 'https://www.facebook.com/favicon.ico'
    };
    return avatars[provider] || null;
  };

  const providers = [
    { id: 'google', name: 'Google', icon: '🔍', color: '#4285F4' },
    { id: 'github', name: 'GitHub', icon: '🐙', color: '#333' },
    { id: 'discord', name: 'Discord', icon: '💬', color: '#5865F2' },
    { id: 'facebook', name: 'Facebook', icon: '📘', color: '#1877F2' }
  ];

  return (
    <div className="social-login">
      <div className="social-divider">
        <span>Or connect instantly with:</span>
      </div>
      <div className="social-buttons">
        {providers.map(provider => (
          <button
            key={provider.id}
            className="social-btn"
            onClick={() => handleSocialLogin(provider.id)}
            onMouseEnter={() => audio.playHover()}
            disabled={loading === provider.id}
            style={{ '--provider-color': provider.color }}
          >
            <span className="social-icon">{provider.icon}</span>
            <span className="social-name">{provider.name}</span>
            {loading === provider.id && <span className="social-spinner">⏳</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
