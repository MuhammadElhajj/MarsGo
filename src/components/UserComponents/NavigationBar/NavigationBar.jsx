// components/UserComponents/NavigationBar/NavigationBar.jsx
import { useTicker } from '../../../context/TickerContext';
import { useEffect, useRef, useState, useCallback } from 'react';
import './NavigationBar.css';

export default function NavigationBar() {
  const { settings, loading } = useTicker();
  const [clones, setClones] = useState([]);
  const wrapperRef = useRef(null);
  const originalRef = useRef(null);

  if (loading) return null;
  if (!settings?.isActive) return null;

  const { segments, speed = 60, direction = 'right-to-left' } = settings;
  const animationName = direction === 'right-to-left' ? 'marquee-rtl' : 'marquee-ltr';

  // بناء المحتوى من المقاطع
  const renderContent = (key) => (
    <div key={key} className="ticker-content">
      {segments.map((seg, idx) => (
        <span key={`${key}-${idx}`} className="ticker-segment" style={{
          color: seg.color,
          fontWeight: seg.fontWeight,
          fontFamily: seg.fontFamily,
        }}>
          {seg.text}
        </span>
      ))}
    </div>
  );

  // حساب عدد النسخ اللازمة لملء العرض مرتين
  const updateClones = useCallback(() => {
    if (!originalRef.current || !wrapperRef.current) return;
    const originalWidth = originalRef.current.offsetWidth;
    const containerWidth = wrapperRef.current.parentElement.offsetWidth;
    if (originalWidth === 0) return;
    // عدد النسخ المطلوب لتغطية العرض مرتين على الأقل
    const copiesNeeded = Math.ceil((containerWidth * 2) / originalWidth);
    const clonesArray = [];
    for (let i = 1; i <= copiesNeeded; i++) {
      clonesArray.push(renderContent(`clone-${i}`));
    }
    setClones(clonesArray);
  }, [segments]);

  useEffect(() => {
    updateClones();
    window.addEventListener('resize', updateClones);
    return () => window.removeEventListener('resize', updateClones);
  }, [updateClones]);

  // تعيين متغير CSS لسرعة الحركة ديناميكياً
  useEffect(() => {
    if (wrapperRef.current) {
      wrapperRef.current.style.setProperty('--marquee-duration', `${speed}s`);
    }
  }, [speed]);

  return (
    <div className="navigation-bar ticker-bar">
      <div 
        ref={wrapperRef}
        className="ticker-wrapper" 
        style={{ animation: `${animationName} var(--marquee-duration, 60s) linear infinite` }}
      >
        {renderContent('original')}
        {clones}
      </div>
    </div>
  );
}

