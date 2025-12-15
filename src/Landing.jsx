import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { audio } from './utils/audioSystem';

const heroStyle = {
  borderRadius: '18px',
  padding: '56px 48px',
  marginBottom: '28px',
  border: '1px solid var(--border)',
  background:
    'linear-gradient(135deg, rgba(63,191,140,0.18), rgba(127,216,190,0.08)),' +
    'radial-gradient(circle at 12% 20%, rgba(255,255,255,0.06), transparent 40%),' +
    'radial-gradient(circle at 88% 18%, rgba(255,255,255,0.05), transparent 42%),' +
    'var(--panel)',
  boxShadow: '0 16px 36px var(--shadow)',
};

const muted = { color: 'var(--muted)' };

const values = [
  {
    title: 'Adaptive Discovery',
    body: 'ZYSCOPE adapts to how you explore — surfacing destinations that match your pace and interests.',
  },
  {
    title: 'Grounded Choices',
    body: 'Balanced scores, real traveler input, and clear signals — no guesswork, no fluff.',
  },
  {
    title: 'Effortless Flow',
    body: 'Smooth navigation, instant saves, and progress that stays synced wherever you go.',
  },
];

export default function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    audio.playPageLoad();
  }, []);

  return (
    <div className="app-shell">
      <main>
        <section style={heroStyle}>
          <h1 style={{ margin: '0 0 12px', fontSize: '32px', cursor: 'default' }} onMouseEnter={() => audio.playHover()}>
            Plan smarter journeys. Play the world.
          </h1>
          <p style={{ ...muted, margin: '0 0 18px', maxWidth: 680, cursor: 'default' }} onMouseEnter={() => audio.playHover()}>
            Visualise where to go next, read the vibes, and log your path as you explore. 
            Built for travelers who want clarity, momentum, and control — not noise.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={() => { audio.playConfirm(); navigate('/login'); }}
              onMouseEnter={() => audio.playHover()}
              style={{
                padding: '12px 16px',
                borderRadius: 12,
                border: '1px solid var(--accent)',
                background: 'var(--accent)',
                color: '#0c1317',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ▶ Start Exploring
            </button>
            <button
              onClick={() => { audio.playConfirm(); navigate('/compare'); }}
              onMouseEnter={() => audio.playHover()}
              style={{
                padding: '12px 16px',
                borderRadius: 12,
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text)',
                cursor: 'pointer',
              }}
            >
              🗺 View Countries
            </button>
          </div>
        </section>

        <section style={{ ...heroStyle, background: 'var(--panel)', display: 'grid', gap: 16 }}>
          <div>
            <h2 style={{ margin: '0 0 10px', cursor: 'default' }} onMouseEnter={() => audio.playHover()}>Travel Intelligence, Simplified</h2>
            <p style={{ ...muted, margin: 0, maxWidth: 640, cursor: 'default' }} onMouseEnter={() => audio.playHover()}>
              Compare destinations across adventure, study, and travel signals. 
              Build a focused shortlist and move with confidence.
            </p>
          </div>
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            {values.map((item) => (
              <article
                key={item.title}
                className="card"
                style={{ padding: '16px 16px 14px', background: '#2a3039', borderColor: 'var(--border)', cursor: 'default' }}
                onMouseEnter={() => audio.playHover()}
              >
                <h3 style={{ margin: '0 0 8px', fontSize: '18px' }}>{item.title}</h3>
                <p style={{ ...muted, margin: 0 }}>{item.body}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
