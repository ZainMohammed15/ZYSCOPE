import { useEffect } from 'react';
import './ParticleEffect.css';

export default function ParticleEffect({ trigger = 0 }) {
  useEffect(() => {
    if (trigger === 0) return;

    const container = document.createElement('div');
    container.className = 'particle-container';
    document.body.appendChild(container);

    // Create particles
    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = `${Math.random() * 100}vw`;
      particle.style.top = `${Math.random() * 100}vh`;
      particle.style.animationDelay = `${Math.random() * 0.5}s`;
      particle.style.setProperty('--tx', `${(Math.random() - 0.5) * 200}px`);
      particle.style.setProperty('--ty', `${-(Math.random() * 100 + 50)}px`);
      container.appendChild(particle);
    }

    // Remove after animation
    setTimeout(() => {
      container.remove();
    }, 2000);
  }, [trigger]);

  return null;
}
