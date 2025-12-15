import React from 'react';
import { Link } from 'react-router-dom';

export default function Logo({ size = 180 }) {
  return (
    <Link to="/" aria-label="ZYSCOPE Home" style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <img src="/logo.png" alt="ZYSCOPE" width={size} height={Math.round(size * 0.34)} style={{ display: 'block' }} />
    </Link>
  );
}
