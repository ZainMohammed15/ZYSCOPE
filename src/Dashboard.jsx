import React, { useEffect, useMemo, useState } from 'react';
import { useUser } from './userContext.jsx';
import { audio } from './utils/audioSystem';
import { LineChart, CountUp, ActivityHeatmap, HorizontalBar } from './components/MiniChart.jsx';
import { get } from './utils/api';
import FetchError from './components/FetchError';
import Tooltip from './components/Tooltip';

function formatAgo(timestamp) {
  if (!timestamp) return '';
  const then = new Date(timestamp);
  const now = new Date();
  const diffMs = now - then;
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'today';
  if (days === 1) return '1d ago';
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

export default function Dashboard() {
  const { user, setUser } = useUser();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [prevLevel, setPrevLevel] = useState(null);

  const visitCount = visits.length;
  const achievements = [
    { label: 'Scout', threshold: 1 },
    { label: 'Explorer', threshold: 5 },
    { label: 'Pathfinder', threshold: 10 },
    { label: 'Globetrotter', threshold: 20 },
  ];

  const travelStats = useMemo(() => {
    const countries = [...new Set(visits.map(v => v.country || 'Unknown'))];
    const totalDistance = visits.length * 500; // Mock calculation
    const avgRating = visits.length > 0 ? 4.2 : 0; // Mock
    const streak = visits.length > 0 ? Math.min(visits.length, 7) : 0;
    const mostVisited = visits.length > 0 ? visits[0].location : 'None yet';
    
    return {
      countries: countries.length,
      distance: totalDistance,
      avgRating,
      streak,
      mostVisited
    };
  }, [visits]);

  const activityData = useMemo(() => {
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const count = visits.filter(v => {
        const vDate = new Date(v.visited_at);
        return vDate.toDateString() === date.toDateString();
      }).length;
      last30Days.push({ label: date.toDateString().slice(4, 10), value: count });
    }
    return last30Days;
  }, [visits]);

  const kpis = useMemo(() => {
    const level = user?.level || 1;
    const points = user?.points || 0;
    const nextCap = level * 250;
    const prevCap = Math.max(0, (level - 1) * 250);
    const pct = Math.min(100, Math.round(((points - prevCap) / (nextCap - prevCap || 1)) * 100));
    return [
      { label: '🌍 Countries visited', value: visitCount, delta: visitCount ? `${visitCount} total` : 'No visits yet', icon: '🏙️' },
      { label: '⭐ Level', value: level, delta: `Next at ${nextCap} XP`, icon: '🎮' },
      { label: '💎 Points', value: points, delta: `${pct}% of next level`, progress: pct, icon: '✨' },
      { label: '🌏 Countries', value: travelStats.countries, delta: `${travelStats.countries} explored`, icon: '🗺️' },
    ];
  }, [visitCount, user, travelStats]);

  const highlights = useMemo(() => {
    return visits.slice(0, 3).map((v) => ({ title: v.location, note: `Visited ${formatAgo(v.visited_at)}` }));
  }, [visits]);

  useEffect(() => {
    audio.playPageLoad();
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const fetchVisits = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await get(`/visits?user_id=${user.id}`);
        setVisits(data.visits || []);
        if (data.user) {
          const newLevel = data.user.level;
          if (prevLevel !== null && newLevel > prevLevel) {
            audio.levelUp();
          }
          setPrevLevel(newLevel);
          setUser({ id: data.user.id, username: data.user.username, level: data.user.level, points: data.user.points });
        }
      } catch (err) {
        setError(err.message || 'Unable to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchVisits();
    const handler = () => fetchVisits();
    window.addEventListener('zyscope:visited', handler);
    return () => window.removeEventListener('zyscope:visited', handler);
  }, [user?.id, setUser]);

  const visitedList = visits.map((v) => ({ city: v.location, when: formatAgo(v.visited_at) }));

  return (
    <div className="app-shell">
      <main>
        <section style={{ marginBottom: 20 }}>
          <h1 style={{ margin: '0 0 12px', cursor: 'default' }} onMouseEnter={() => audio.playHover()}>
            🎮 Dashboard
          </h1>
          <p style={{ color: 'var(--muted)', margin: 0 }}>Your journey so far — progress, highlights, and momentum</p>
        </section>

        {loading && <div style={{ color: 'var(--muted)', marginBottom: 12 }}>⏳ Loading dashboard...</div>}
        {error && <FetchError message={error} onRetry={() => window.location.reload()} />}

        {/* KPI Cards */}
        <section style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: 20 }}>
          {kpis.map((item) => (
            <article 
              key={item.label} 
              className="card" 
              style={{ 
                padding: '14px 14px 12px',
                transition: 'transform 200ms ease, box-shadow 200ms ease'
              }}
              onMouseEnter={(e) => {
                audio.playHover();
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(255, 222, 47, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <Tooltip
                label={item.label}
                info={
                  item.label.includes('Countries visited') ? 'Total number of unique countries you have explored on your journey.'
                  : item.label.includes('Level') ? 'Your current level based on accumulated experience points. Unlock new features as you level up!'
                  : item.label.includes('Points') ? 'Experience points earned from visiting countries and completing achievements.'
                  : item.label.includes('Countries') ? 'Number of different countries represented in your visited trips.'
                  : item.delta
                }
                icon="ℹ"
              >
                <div style={{ color: 'var(--muted)', fontSize: 13 }}>{item.label}</div>
              </Tooltip>
              <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>
                <CountUp end={item.value} duration={1200} />
              </div>
              <div style={{ color: 'var(--accent-2)', fontSize: 12, marginTop: 2 }}>{item.delta}</div>
              {item.progress !== undefined && (
                <div className="progress-rail" style={{ marginTop: 8 }}>
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${item.progress}%`,
                      transition: 'width 1s ease'
                    }} 
                  />
                </div>
              )}
            </article>
          ))}
        </section>

        {/* Travel Stats */}
        <section className="card" style={{ marginBottom: 20, padding: '18px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>📊 Travel Statistics</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>🌟 Average Rating</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent)' }}>
                {travelStats.avgRating.toFixed(1)} <span style={{ fontSize: 16 }}>/ 5.0</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>🛤️ Total Distance</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent-neon)' }}>
                {travelStats.distance.toLocaleString()} <span style={{ fontSize: 16 }}>km</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>🔥 Current Streak</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#ff6b6b' }}>
                {travelStats.streak} <span style={{ fontSize: 16 }}>days</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>🏆 Most Visited</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)' }}>
                {travelStats.mostVisited}
              </div>
            </div>
          </div>
        </section>

        {/* Activity Chart */}
        <section className="card" style={{ marginBottom: 20, padding: '18px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>📈 Activity (Last 30 Days)</h3>
          <div style={{ overflowX: 'auto' }}>
            <LineChart data={activityData} width={600} height={120} color="#5ef0ff" />
          </div>
        </section>

        {/* Activity Heatmap */}
        <section className="card" style={{ marginBottom: 20, padding: '18px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>🗓️ Activity Heatmap</h3>
          <ActivityHeatmap days={30} />
        </section>

        {/* Achievements */}
        <section className="card" style={{ marginBottom: 20 }}>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {achievements.map((ach) => {
              const unlocked = visitCount >= ach.threshold;
              return (
                <span
                  key={ach.label}
                  className="glow-chip"
                  onMouseEnter={() => audio.playHover()}
                  style={{
                    background: unlocked ? 'rgba(255, 222, 47, 0.14)' : 'rgba(255, 255, 255, 0.04)',
                    borderColor: unlocked ? 'rgba(255, 222, 47, 0.6)' : 'rgba(255, 255, 255, 0.08)',
                    color: unlocked ? '#ffde2f' : 'var(--muted)',
                    cursor: 'default',
                    transition: 'transform 200ms ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {unlocked ? '✅ Unlocked' : '🔒 Locked'} · {ach.label}
                </span>
              );
            })}
          </div>
        </section>

        <section className="card" style={{ marginBottom: 20 }}>
          
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            {(highlights.length ? highlights : [{ title: 'No visits yet', note: 'Explore to see highlights' }]).map((item) => (
              <article key={item.title} className="card" style={{ padding: '14px 14px 12px', background: '#2a3039', borderColor: 'var(--border)' }}>
                <h3 style={{ margin: '0 0 6px' }}>{item.title}</h3>
                <p style={{ margin: 0, color: 'var(--muted)' }}>{item.note}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="card">
          
          <div style={{ display: 'grid', gap: 10 }}>
            {(visitedList.length ? visitedList : [{ city: 'No visits yet', when: '' }]).map((item) => (
              <div
                key={`${item.city}-${item.when}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  background: '#20252d',
                }}
              >
                <span style={{ fontWeight: 600 }}>{item.city}</span>
                <span style={{ color: 'var(--muted)', fontSize: 12 }}>{item.when}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
