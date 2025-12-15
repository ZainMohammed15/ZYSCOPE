import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Logo Component
 * Displays the ZYSCOPE brand identity
 */
export default function Logo({ size = 'medium', onClick = null }) {
  const sizes = {
    small: { height: 28, width: 93 },
    medium: { height: 42, width: 140 },
    large: { height: 56, width: 187 },
    xlarge: { height: 80, width: 267 },
  };

  const dimensions = sizes[size] || sizes.medium;

  return (
    <Link 
      to="/" 
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        textDecoration: 'none',
        transition: 'transform 180ms ease, opacity 180ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.02)';
        e.currentTarget.style.opacity = '0.9';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.opacity = '1';
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = 'scale(0.98)';
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'scale(1.02)';
      }}
    >
      <img 
        src="/logo.svg" 
        alt="ZYSCOPE" 
        style={{
          height: dimensions.height,
          width: 'auto',
          display: 'block',
          filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.4))',
        }}
      />
    </Link>
  );
}

/**
 * Favicon Component - For displaying favicon in UI
 */
export function Favicon({ size = 32 }) {
  return (
    <img 
      src="/favicon.svg" 
      alt="ZYSCOPE Icon" 
      style={{
        width: size,
        height: size,
        display: 'inline-block',
        verticalAlign: 'middle',
      }}
    />
  );
}
