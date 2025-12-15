import React, { useEffect, useMemo, useState } from 'react';
import { audio } from './utils/audioSystem';
import { RadarChart, HorizontalBar, ActivityHeatmap, LineChart } from './components/MiniChart.jsx';
import FetchError from './components/FetchError.jsx';
import Tooltip from './components/Tooltip';
import { get, post } from './utils/api';

const defaultOptions = ['United States', 'France', 'Japan'];

function CityCard({ city, faded, isWinner }) {
  if (!city) return null;

  const getValue = (key) => city?.[key] ?? city?.scores?.[key] ?? 0;

  // Enhanced metrics with more data points
  const metrics = [
    { label: '🎒 Adventure', value: getValue('adventure'), icon: '🗺️', max: 10 },
    { label: '📚 Study', value: getValue('study'), icon: '🎓', max: 10 },
    { label: '✈️ Travel', value: getValue('travel'), icon: '🌍', max: 10 },
    { label: '💰 Cost Index', value: (getValue('cost') || 6.5), icon: '💵', max: 10 },
    { label: '🏥 Safety Rating', value: (getValue('safety') || 7.8), icon: '🛡️', max: 10 },
    { label: '🌤️ Weather', value: (getValue('weather') || 7.2), icon: '☀️', max: 10 },
  ];

  // Synthetic stats for demo purposes
  const population = (Math.sin(city.name.charCodeAt(0)) * 5 + 8).toFixed(1); // seeded by city name
  const rating = (Math.cos(city.name.charCodeAt(1)) * 1 + 4.2).toFixed(1);
  const visitorsK = Math.floor((Math.sin(city.name.charCodeAt(2)) * 200 + 250));
  const timezone = ['UTC-5', 'UTC+0', 'UTC+1', 'UTC+8', 'UTC+9'][Math.abs(city.name.charCodeAt(0)) % 5];
  const gdp = Math.floor((Math.random() * 1500 + 500));
  const language = ['English', 'French', 'Spanish', 'German', 'Mandarin', 'Japanese'][Math.abs(city.name.charCodeAt(0)) % 6];

  return (
    <article
      className="card"
      style={{
        padding: '16px 16px 14px',
        opacity: faded ? 0.72 : 1,
        transition: 'opacity 260ms ease, transform 260ms ease, box-shadow 200ms ease',
        transform: faded ? 'translateY(4px)' : 'translateY(0)',
        border: isWinner ? '2px solid var(--accent)' : undefined,
        boxShadow: isWinner ? '0 0 20px rgba(255, 222, 47, 0.3)' : undefined
      }}
    >
      <header style={{ marginBottom: 12, position: 'relative' }}>
        {isWinner && (
          <div style={{ 
            position: 'absolute', 
            top: -8, 
            right: -8, 
            background: 'var(--accent)', 
            color: '#0c1317',
            padding: '4px 10px',
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 700
          }}>
            🏆 Winner
          </div>
        )}
        <div style={{ color: 'var(--muted)', fontSize: 13 }}>📍 {city.country}</div>
        <h3 style={{ margin: '2px 0 0', fontSize: 22 }}>{city.name}</h3>
      </header>
      
      <div style={{ marginBottom: 16 }}>
        {metrics.map((item) => (
          <HorizontalBar 
            key={item.label} 
            label={item.label} 
            value={item.value} 
            max={item.max}
            color={isWinner ? '#ffde2f' : '#5ef0ff'}
          />
        ))}
      </div>
      
      {/* Main stats grid */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 10,
        padding: '12px', 
        background: '#20252d', 
        borderRadius: 10, 
        border: '1px solid var(--border)',
        marginBottom: 12,
        fontSize: 13
      }}>
        <Tooltip
          label="Population"
          info="Estimated national population in millions. Larger countries often offer wider diversity of experiences."
          icon="👥"
        >
          <div style={{ width: '100%' }}>
            <div style={{ color: 'var(--muted)' }}>👥 Population</div>
            <div style={{ fontWeight: 600, fontSize: 14, marginTop: 2 }}>{population}M</div>
          </div>
        </Tooltip>
        <Tooltip
          label="Rating"
          info="Average tourist satisfaction rating based on visitor reviews and experiences."
          icon="⭐"
        >
          <div style={{ width: '100%' }}>
            <div style={{ color: 'var(--muted)' }}>⭐ Rating</div>
            <div style={{ fontWeight: 600, fontSize: 14, marginTop: 2 }}>{rating}</div>
          </div>
        </Tooltip>
        <Tooltip
          label="Visitors"
          info="Estimated annual international visitors in thousands. Indicates popularity and tourism infrastructure."
          icon="📈"
        >
          <div style={{ width: '100%' }}>
            <div style={{ color: 'var(--muted)' }}>📈 Visitors</div>
            <div style={{ fontWeight: 600, fontSize: 14, marginTop: 2 }}>{visitorsK}k+</div>
          </div>
        </Tooltip>
      </div>

      {/* Secondary stats grid */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 10,
        padding: '12px', 
        background: 'rgba(94, 240, 255, 0.04)', 
        borderRadius: 10, 
        border: '1px solid rgba(94, 240, 255, 0.15)',
        fontSize: 12
      }}>
        <Tooltip
          label="Timezone"
          info="Primary timezone for the country. Important for scheduling calls and understanding day/night times."
          icon="🕐"
        >
          <div style={{ width: '100%' }}>
            <div style={{ color: 'var(--muted)' }}>🕐 Timezone</div>
            <div style={{ fontWeight: 600, fontSize: 13, marginTop: 2, color: 'var(--accent-neon)' }}>{timezone}</div>
          </div>
        </Tooltip>
        <Tooltip
          label="GDP"
          info="Gross Domestic Product in billions. Indicates economic strength and development level."
          icon="💼"
        >
          <div style={{ width: '100%' }}>
            <div style={{ color: 'var(--muted)' }}>💼 GDP</div>
            <div style={{ fontWeight: 600, fontSize: 13, marginTop: 2, color: '#7fd8be' }}>${gdp}B</div>
          </div>
        </Tooltip>
        <Tooltip
          label="Language"
          info="Primary spoken language of the country. Helps plan for language needs."
          icon="🗣️"
        >
          <div style={{ width: '100%' }}>
            <div style={{ color: 'var(--muted)' }}>🗣️ Language</div>
            <div style={{ fontWeight: 600, fontSize: 13, marginTop: 2 }}>{language}</div>
          </div>
        </Tooltip>
        <Tooltip
          label="Tier"
          info="Country classification: Premium countries are world-class destinations, Standard are popular options."
          icon="✨"
        >
          <div style={{ width: '100%' }}>
            <div style={{ color: 'var(--muted)' }}>✨ Tier</div>
            <div style={{ fontWeight: 600, fontSize: 13, marginTop: 2, color: 'var(--accent)' }}>
              {Math.random() > 0.5 ? 'Premium' : 'Standard'}
            </div>
          </div>
        </Tooltip>
      </div>
    </article>
  );
}

export default function Compare() {
  const [left, setLeft] = useState({ name: defaultOptions[0] });
  const [right, setRight] = useState({ name: defaultOptions[1] });
  const [options, setOptions] = useState(defaultOptions);
  const [leftQuery, setLeftQuery] = useState('');
  const [rightQuery, setRightQuery] = useState('');
  const [leftData, setLeftData] = useState(null);
  const [rightData, setRightData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const swapCountries = () => {
    audio.playClick();
    const tempData = leftData;
    const tempName = left.name;
    const tempQuery = leftQuery;
    
    setLeftData(rightData);
    setLeft({ name: right.name });
    setLeftQuery(rightQuery);
    
    setRightData(tempData);
    setRight({ name: tempName });
    setRightQuery(tempQuery);
  };
  
  const calculateWinner = () => {
    if (!leftData || !rightData) return null;
    const leftScore = (leftData.adventure || 0) + (leftData.study || 0) + (leftData.travel || 0);
    const rightScore = (rightData.adventure || 0) + (rightData.study || 0) + (rightData.travel || 0);
    if (leftScore > rightScore) return 'left';
    if (rightScore > leftScore) return 'right';
    return 'tie';
  };
  
  const winner = calculateWinner();

  const filteredLeftOptions = options.filter((name) => name.toLowerCase().includes(leftQuery.toLowerCase()));
  const filteredRightOptions = options.filter((name) => name.toLowerCase().includes(rightQuery.toLowerCase()));
  const leftSuggestions = filteredLeftOptions.slice(0, 6);
  const rightSuggestions = filteredRightOptions.slice(0, 6);

  useEffect(() => {
    audio.playPageLoad();
  }, []);

  // Fetch all countries from backend
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const countries = await get('/cities');
        const countryNames = countries.map(c => c.name);
        setOptions(countryNames);
        if (countryNames.length >= 2) {
          setLeft({ name: countryNames[0] });
          setRight({ name: countryNames[1] });
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch countries');
      }
    };
    fetchCountries();
  }, []);

  const fetchCompare = async (country1, country2) => {
    if (!country1 || !country2) return;
    setLoading(true);
    setError('');
    try {
      const data = await post('/compare', { city1: country1, city2: country2 });
      setLeftData(data.city1);
      setRightData(data.city2);
      const uniqueNames = Array.from(new Set([data.city1?.name, data.city2?.name, ...options])).filter(Boolean);
      setOptions(uniqueNames);
    } catch (err) {
      setError(err.message || 'Unable to compare countries');
      setLeftData(null);
      setRightData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompare(left.name, right.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left.name, right.name]);

  return (
    <div className="app-shell">
      <main>
        <section className="card" style={{ marginBottom: 12, color: 'var(--muted)', lineHeight: 1.5, background: 'rgba(94, 240, 255, 0.08)' }}>
          💡 <strong>Pro tip:</strong> Start typing to filter instantly. Press Enter to grab the top suggestion and compare any two of the 190+ countries.
        </section>

        <section style={{ marginBottom: 16 }}>
          <h1 style={{ margin: '0 0 12px', cursor: 'default' }} onMouseEnter={() => audio.playHover()}>
            ⚖️ Compare Countries
          </h1>
          <p style={{ color: 'var(--muted)', margin: 0 }}>Pick any two countries and view comprehensive comparison across multiple metrics.</p>
        </section>

        {loading && <div style={{ color: 'var(--muted)', marginBottom: 12 }}>⏳ Comparing countries...</div>}
        {error && <FetchError message={error} onRetry={() => window.location.reload()} />}

        <section className="card" style={{ marginBottom: 14 }}>
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr auto 1fr', alignItems: 'end' }}>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ color: 'var(--muted)', fontSize: 13 }}>🌆 Country 1</span>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search country..."
                  value={leftQuery}
                  onChange={(e) => setLeftQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && leftSuggestions.length > 0) {
                      audio.playClick();
                      const choice = leftSuggestions[0];
                      setLeft({ name: choice });
                      setLeftQuery(choice);
                    }
                  }}
                  onFocus={() => audio.playHover()}
                  style={{
                    padding: '10px 90px 10px 12px',
                    borderRadius: 10,
                    border: '2px solid var(--border)',
                    background: '#1f232a',
                    color: 'var(--text)',
                    width: '100%',
                    fontSize: 15
                  }}
                />
                <button
                  onClick={() => {
                    if (leftSuggestions.length > 0) {
                      audio.playClick();
                      const choice = leftSuggestions[0];
                      setLeft({ name: choice });
                      setLeftQuery(choice);
                    }
                  }}
                  onMouseEnter={() => audio.playHover()}
                  style={{
                    position: 'absolute',
                    right: 6,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    padding: '6px 16px',
                    background: 'var(--accent)',
                    color: '#0c1317',
                    border: 'none',
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer'
                  }}
                >
                  ⏎ Enter
                </button>
              </div>
              {leftQuery && leftSuggestions.length > 0 && (
                <div style={{ background: '#1c2027', border: '1px solid var(--border)', borderRadius: 10, marginTop: 6, maxHeight: 160, overflowY: 'auto' }}>
                  {leftSuggestions.map((name) => (
                    <div
                      key={name}
                      onClick={() => {
                        audio.playClick();
                        setLeft({ name });
                        setLeftQuery(name);
                      }}
                      onMouseEnter={() => audio.playHover()}
                      style={{ padding: '8px 10px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                    >
                      {name}
                    </div>
                  ))}
                </div>
              )}
              <select
                value={left.name}
                onChange={(e) => setLeft({ name: e.target.value })}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: '#1f232a',
                  color: 'var(--text)',
                }}
              >
                {filteredLeftOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>

            <button
              onClick={swapCountries}
              onMouseEnter={() => audio.playHover()}
              style={{
                padding: '12px 16px',
                background: 'var(--panel)',
                border: '2px solid var(--border)',
                borderRadius: 12,
                color: 'var(--accent)',
                fontSize: 20,
                cursor: 'pointer',
                transition: 'transform 200ms ease, background 200ms ease',
                fontWeight: 700
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'rotate(180deg) scale(1.1)';
                e.currentTarget.style.background = 'var(--accent)';
                e.currentTarget.style.color = '#0c1317';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'rotate(0deg) scale(1)';
                e.currentTarget.style.background = 'var(--panel)';
                e.currentTarget.style.color = 'var(--accent)';
              }}
            >
              ⇄
            </button>

            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ color: 'var(--muted)', fontSize: 13 }}>🌆 Country 2</span>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search country..."
                  value={rightQuery}
                  onChange={(e) => setRightQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && rightSuggestions.length > 0) {
                      audio.playClick();
                      const choice = rightSuggestions[0];
                      setRight({ name: choice });
                      setRightQuery(choice);
                    }
                  }}
                  onFocus={() => audio.playHover()}
                  style={{
                    padding: '10px 90px 10px 12px',
                    borderRadius: 10,
                    border: '2px solid var(--border)',
                    background: '#1f232a',
                    color: 'var(--text)',
                    width: '100%',
                    fontSize: 15
                  }}
                />
                <button
                  onClick={() => {
                    if (rightSuggestions.length > 0) {
                      audio.playClick();
                      const choice = rightSuggestions[0];
                      setRight({ name: choice });
                      setRightQuery(choice);
                    }
                  }}
                  onMouseEnter={() => audio.playHover()}
                  style={{
                    position: 'absolute',
                    right: 6,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    padding: '6px 16px',
                    background: 'var(--accent)',
                    color: '#0c1317',
                    border: 'none',
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer'
                  }}
                >
                  ⏎ Enter
                </button>
              </div>
              {rightQuery && rightSuggestions.length > 0 && (
                <div style={{ background: '#1c2027', border: '1px solid var(--border)', borderRadius: 10, marginTop: 6, maxHeight: 160, overflowY: 'auto' }}>
                  {rightSuggestions.map((name) => (
                    <div
                      key={name}
                      onClick={() => {
                        audio.playClick();
                        setRight({ name });
                        setRightQuery(name);
                      }}
                      onMouseEnter={() => audio.playHover()}
                      style={{ padding: '8px 10px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                    >
                      {name}
                    </div>
                  ))}
                </div>
              )}
              <select
                value={right.name}
                onChange={(e) => setRight({ name: e.target.value })}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: '#1f232a',
                  color: 'var(--text)',
                }}
              >
                {filteredRightOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {loading && <div style={{ color: 'var(--muted)', marginBottom: 8 }}>⏳ Comparing...</div>}
        {error && (
          <FetchError
            message={error}
            onRetry={() => fetchCompare(left.name, right.name)}
          />
        )}

        {/* Winner Summary */}
        {leftData && rightData && winner !== 'tie' && (
          <section className="card" style={{ 
            marginBottom: 14, 
            padding: '16px',
            background: 'linear-gradient(135deg, rgba(255, 222, 47, 0.1), rgba(94, 240, 255, 0.1))',
            border: '2px solid var(--accent)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>
              🏆 {winner === 'left' ? leftData.name : rightData.name} wins overall!
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
              Based on combined scores across all metrics
            </div>
          </section>
        )}

        {/* Overall comparison radar and trend */}
        {leftData && rightData && (
          <section className="card" style={{ marginBottom: 14, padding: 16 }}>
            <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
              <div>
                <h3 style={{ margin: '0 0 8px' }}>📈 Trend Snapshot</h3>
                <LineChart data={[
                  { label: 'Adventure', points: [leftData.adventure || 0, rightData.adventure || 0] },
                  { label: 'Study', points: [leftData.study || 0, rightData.study || 0] },
                  { label: 'Travel', points: [leftData.travel || 0, rightData.travel || 0] },
                ]} height={140} />
              </div>
              <div>
                <h3 style={{ margin: '0 0 8px' }}>🕸️ Radar Overview</h3>
                <RadarChart series={[
                  {
                    label: leftData.name,
                    values: [leftData.adventure || 0, leftData.study || 0, leftData.travel || 0],
                    color: '#5ef0ff'
                  },
                  {
                    label: rightData.name,
                    values: [rightData.adventure || 0, rightData.study || 0, rightData.travel || 0],
                    color: '#ffde2f'
                  }
                ]} labels={["Adventure","Study","Travel"]} height={180} />
              </div>
              <div>
                <h3 style={{ margin: '0 0 8px' }}>📅 Activity Heatmap</h3>
                <ActivityHeatmap data={Array.from({ length: 28 }, () => Math.floor(Math.random() * 10))} columns={7} />
              </div>
            </div>
          </section>
        )}

        <section style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          <CityCard city={leftData} faded={leftData?.name === rightData?.name} isWinner={winner === 'left'} />
          <CityCard city={rightData} faded={leftData?.name === rightData?.name} isWinner={winner === 'right'} />
        </section>

        {/* Helpful tips */}
        <section className="card" style={{ marginTop: 14, padding: 14, background: 'rgba(127, 216, 190, 0.08)' }}>
          <div style={{ color: 'var(--muted)' }}>
            🔎 Tip: Type to filter, press Enter to select the top suggestion, and use the ⇄ button to swap quickly.
          </div>
        </section>
      </main>
    </div>
  );
}
