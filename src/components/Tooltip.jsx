import React, { useState } from 'react';

export default function Tooltip({ label, info, icon = '❓', children }) {
  const [show, setShow] = useState(false);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'help' }}
      >
        {children}
        {/* Floating indicator icon */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: 'rgba(94, 240, 255, 0.12)',
            border: '1px solid rgba(94, 240, 255, 0.35)',
            fontSize: 12,
            color: '#5ef0ff',
            fontWeight: 600,
            cursor: 'help',
            animation: 'pulse 2s infinite',
          }}
        >
          {icon}
        </div>
      </div>

      {/* Tooltip box */}
      {show && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#1a1f27',
            border: '1px solid rgba(94, 240, 255, 0.3)',
            borderRadius: 10,
            padding: '12px 14px',
            marginBottom: 8,
            maxWidth: 240,
            fontSize: 13,
            color: '#f5f7fb',
            lineHeight: 1.5,
            zIndex: 999,
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            animation: 'fadeIn 200ms ease-out',
            pointerEvents: 'none',
            whiteSpace: 'normal',
            wordWrap: 'break-word',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--accent)' }}>
            {label}
          </div>
          <div style={{ color: 'var(--muted)', fontSize: 12 }}>{info}</div>
          {/* Arrow pointer */}
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid #1a1f27',
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(4px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}
