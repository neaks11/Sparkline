'use client';

import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sparkline_theme');
    const enabled = saved === 'dark';
    document.documentElement.classList.toggle('dark', enabled);
    setIsDark(enabled);
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('sparkline_theme', next ? 'dark' : 'light');
  };

  return (
    <button type="button" onClick={toggle} className="btn-secondary">
      {isDark ? '☀️ Light' : '🌙 Dark'}
    </button>
  );
}
