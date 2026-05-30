import { useState, useEffect } from 'react';
import { FiSun, FiMoon } from 'react-icons/fi';
import './ThemeToggle.css';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggle = () => setIsDark(prev => !prev);

  return (
    <button className="theme-toggle" onClick={toggle}>
      {isDark ? <FiSun size={18} /> : <FiMoon size={18} />}
    </button>
  );
}