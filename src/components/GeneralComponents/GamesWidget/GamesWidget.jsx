// src/components/GeneralComponents/GamesWidget/GamesWidget.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiZap } from 'react-icons/fi';
import './GamesWidget.css';

export default function GamesWidget() {
  const navigate = useNavigate();
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const widgetRef = useRef(null);
  const hasMoved = useRef(false);

  // ✅ الموضع الابتدائي: منتصف الجانب الأيمن مع إزاحة 5px
  useEffect(() => {
    const size = 60; // حجم الدائرة
    const initialX = window.innerWidth - size - 5; // right: 5px
    const initialY = (window.innerHeight - size) / 1.4; // top: 50% - half size
    setPosition({ x: initialX, y: initialY });
  }, []);

  const handleDragStart = (e) => {
    const touch = e.touches ? e.touches[0] : e;
    const rect = widgetRef.current.getBoundingClientRect();
    setOffset({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    });
    setIsDragging(true);
    hasMoved.current = false;
  };

  useEffect(() => {
    const handleDragMove = (e) => {
      if (!isDragging) return;
      hasMoved.current = true;
      const touch = e.touches ? e.touches[0] : e;
      const newX = touch.clientX - offset.x;
      const newY = touch.clientY - offset.y;

      const size = 60;
      const maxX = window.innerWidth - size;
      const maxY = window.innerHeight - size;
      setPosition({
        x: Math.min(Math.max(newX, 0), maxX),
        y: Math.min(Math.max(newY, 0), maxY),
      });
    };

    const handleDragEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('touchmove', handleDragMove, { passive: true });
      document.addEventListener('mouseup', handleDragEnd);
      document.addEventListener('touchend', handleDragEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('touchmove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
      document.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging, offset]);

  const handleClick = () => {
    if (hasMoved.current) {
      hasMoved.current = false;
      return;
    }
    navigate('/games-hub');
  };

  return (
    <div
      ref={widgetRef}
      className="games-widget"
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 1000,
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none',
        userSelect: 'none',
      }}
      onMouseDown={handleDragStart}
      onTouchStart={handleDragStart}
      onClick={handleClick}
    >
      <div className="games-widget__content">
        <div className="games-widget__wheel">
          <div className="games-widget__segment" style={{ '--rotation': '0deg', '--color': '#f59e0b' }}></div>
          <div className="games-widget__segment" style={{ '--rotation': '45deg', '--color': '#8b5cf6' }}></div>
          <div className="games-widget__segment" style={{ '--rotation': '90deg', '--color': '#10b981' }}></div>
          <div className="games-widget__segment" style={{ '--rotation': '135deg', '--color': '#ef4444' }}></div>
          <div className="games-widget__segment" style={{ '--rotation': '180deg', '--color': '#3b82f6' }}></div>
          <div className="games-widget__segment" style={{ '--rotation': '225deg', '--color': '#f97316' }}></div>
          <div className="games-widget__segment" style={{ '--rotation': '270deg', '--color': '#ec4899' }}></div>
          <div className="games-widget__segment" style={{ '--rotation': '315deg', '--color': '#14b8a6' }}></div>
        </div>
        <div className="games-widget__center">
          <FiZap className="games-widget__icon" />
          <span className="games-widget__label">حظ</span>
        </div>
      </div>
    </div>
  );
}