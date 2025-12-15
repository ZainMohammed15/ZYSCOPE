import React, { useEffect, useState } from 'react';

// Simple line chart component - handles both value and points array formats
export function LineChart({ data, width = 300, height = 100, color = '#ffde2f' }) {
  if (!data || data.length === 0) return null;
  
  // Flatten all values into a single array
  const allValues = data.flatMap(d => d.points || (d.value ? [d.value] : []));
  if (allValues.length === 0) return null;
  
  const max = Math.max(...allValues);
  const min = Math.min(...allValues);
  const range = max - min || 1;
  
  const pointsPerMetric = data[0].points ? data[0].points.length : 1;
  
  // Create line for each metric if points array exists
  const lines = data.map((d, metricIdx) => {
    const points = d.points || [d.value];
    const linePoints = points.map((v, i) => {
      const x = (i / (points.length - 1 || 1)) * width;
      const y = height - ((v - min) / range) * (height - 20);
      return `${x},${y}`;
    }).join(' ');
    
    const colors = ['#5ef0ff', '#ffde2f', '#7fd8be'];
    const lineColor = colors[metricIdx % colors.length];
    
    return (
      <g key={metricIdx}>
        <polyline
          points={linePoints}
          fill="none"
          stroke={lineColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((v, i) => {
          const x = (i / (points.length - 1 || 1)) * width;
          const y = height - ((v - min) / range) * (height - 20);
          return <circle key={`${metricIdx}-${i}`} cx={x} cy={y} r="3" fill={lineColor} opacity="0.8" />;
        })}
      </g>
    );
  });
  
  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      {lines}
    </svg>
  );
}

// Animated counter component
export function CountUp({ end, duration = 1000, suffix = '' }) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let start = 0;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    
    return () => clearInterval(timer);
  }, [end, duration]);
  
  return <span>{count}{suffix}</span>;
}

// Radar chart for comparing multiple metrics
export function RadarChart({ series = [], labels = [], width = 200, height = 200 }) {
  if (!series || series.length === 0 || !labels || labels.length === 0) return null;
  
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 20;
  const angleStep = (2 * Math.PI) / labels.length;
  
  // Draw guide circles and axes
  const guideCircles = [0.25, 0.5, 0.75, 1].map(scale => {
    const r = radius * scale;
    return (
      <circle
        key={`guide-${scale}`}
        cx={centerX}
        cy={centerY}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="1"
      />
    );
  });
  
  const axes = labels.map((label, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    return (
      <g key={`axis-${i}`}>
        <line
          x1={centerX}
          y1={centerY}
          x2={x}
          y2={y}
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="1"
        />
        <text
          x={x + Math.cos(angle) * 15}
          y={y + Math.sin(angle) * 15}
          fill="var(--muted)"
          fontSize="10"
          textAnchor="middle"
        >
          {label}
        </text>
      </g>
    );
  });
  
  // Draw polygons for each series
  const polygons = series.map((s, seriesIdx) => {
    const points = (s.values || []).map((value, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const normalized = value / 10; // Normalize to 0-1 range
      const x = centerX + Math.cos(angle) * radius * normalized;
      const y = centerY + Math.sin(angle) * radius * normalized;
      return `${x},${y}`;
    }).join(' ');
    
    return (
      <g key={`series-${seriesIdx}`}>
        <polygon
          points={points}
          fill={`${s.color}20`}
          stroke={s.color}
          strokeWidth="2"
        />
      </g>
    );
  });
  
  return (
    <svg width={width} height={height}>
      {guideCircles}
      {axes}
      {polygons}
    </svg>
  );
}

// Horizontal bar chart
export function HorizontalBar({ label, value, max = 10, color = '#ffde2f' }) {
  const percentage = (value / max) * 100;
  
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{value}/{max}</span>
      </div>
      <div style={{ 
        width: '100%', 
        height: 8, 
        background: 'rgba(255,255,255,0.1)', 
        borderRadius: 4,
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${percentage}%`,
          height: '100%',
          background: color,
          transition: 'width 800ms ease',
          borderRadius: 4
        }} />
      </div>
    </div>
  );
}

// Vertical bar chart for comparing values across categories
export function BarChart({ data = [], width = 300, height = 200, colors = ['#5ef0ff', '#ffde2f', '#7fd8be'] }) {
  if (!data || data.length === 0) return null;
  
  const max = Math.max(...data.flatMap(d => d.values || [d.value || 0]));
  const padding = 20;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const barWidth = chartWidth / (data.length * 1.5);
  
  const bars = data.flatMap((item, i) => {
    const values = item.values || [item.value || 0];
    const baseX = padding + (i * chartWidth) / data.length + (chartWidth / data.length - barWidth * values.length) / 2;
    
    return values.map((v, j) => {
      const barHeight = (v / max) * chartHeight;
      const x = baseX + j * barWidth;
      const y = height - padding - barHeight;
      const color = colors[j % colors.length];
      
      return (
        <g key={`${i}-${j}`}>
          <rect
            x={x}
            y={y}
            width={barWidth - 2}
            height={barHeight}
            fill={color}
            opacity="0.8"
          />
        </g>
      );
    });
  });
  
  return (
    <svg width={width} height={height}>
      {bars}
    </svg>
  );
}

// Activity heatmap (like GitHub)
export function ActivityHeatmap({ data = [], columns = 7, width = null }) {
  const days = data.length > 0 ? data.length : 30;
  const cells = [];
  
  for (let i = 0; i < days; i++) {
    const today = new Date();
    today.setDate(today.getDate() - (days - 1 - i));
    const level = Math.min(4, Math.floor((data[i] || Math.floor(Math.random() * 5)) / 2.5));
    const colors = ['#20252d', 'rgba(255,222,47,0.2)', 'rgba(255,222,47,0.4)', 'rgba(255,222,47,0.6)', '#ffde2f'];
    
    cells.push(
      <div
        key={i}
        title={today.toDateString()}
        style={{
          width: 12,
          height: 12,
          background: colors[level],
          borderRadius: 2,
          border: '1px solid var(--border)'
        }}
      />
    );
  }
  
  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: `repeat(${columns}, 14px)`, 
      gap: 2,
      maxWidth: '100%'
    }}>
      {cells}
    </div>
  );
}
