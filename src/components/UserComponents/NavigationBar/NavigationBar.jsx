// components/UserComponents/NavigationBar/NavigationBar.jsx
import { useTicker } from '../../../context/TickerContext';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import './NavigationBar.css';

export default function NavigationBar() {
  const { settings, loading } = useTicker();
  const [clonesCount, setClonesCount] = useState(0);
  const wrapperRef = useRef(null);
  const originalRef = useRef(null);
  const resizeObserverRef = useRef(null);

  if (loading) return null;
  if (!settings?.isActive) return null;

  const { segments, speed = 60, direction = 'right-to-left', pauseOnHover = true } = settings;
  const animationName = direction === 'right-to-left' ? 'marquee-rtl' : 'marquee-ltr';

  // بناء المحتوى (يمكن تمريره كلقطة أو كعناصر JSX)
  const renderContent = useCallback((key) => (
    <div key={key} className="ticker-content">
      {segments.map((seg, idx) => (
        <span 
          key={`${key}-${idx}`} 
          className="ticker-segment"
          style={{
            color: seg.color || 'inherit',
            fontWeight: seg.fontWeight || 'normal',
            fontFamily: seg.fontFamily || 'inherit',
            fontSize: seg.fontSize || '1rem',
          }}
        >
          {seg.text}
        </span>
      ))}
    </div>
  ), [segments]);

  // حساب عدد النسخ اللازم لملء العرض مرتين على الأقل
  const updateClonesCount = useCallback(() => {
    if (!originalRef.current || !wrapperRef.current) return;

    const originalWidth = originalRef.current.offsetWidth;
    const container = wrapperRef.current.parentElement;
    if (!container) return;
    
    const containerWidth = container.offsetWidth;
    
    if (originalWidth === 0) {
      setClonesCount(0);
      return;
    }

    // نحتاج إلى تغطية عرض الحاوية مرتين على الأقل لضمان عدم وجود فراغ
    const requiredWidth = containerWidth * 2;
    const copiesNeeded = Math.ceil(requiredWidth / originalWidth);
    // نضيف نسخة احتياطية واحدة للتأكد من السلاسة
    setClonesCount(Math.max(1, copiesNeeded));
  }, []);

  // مراقبة تغير حجم العنصر الأصلي باستخدام ResizeObserver
  useEffect(() => {
    if (!originalRef.current) return;

    updateClonesCount();

    // إنشاء ResizeObserver لمراقبة تغير حجم المحتوى الأصلي (مثلاً عند تغيير الخط أو النص)
    resizeObserverRef.current = new ResizeObserver(() => {
      updateClonesCount();
    });
    resizeObserverRef.current.observe(originalRef.current);

    // مراقبة تغير حجم النافذة
    window.addEventListener('resize', updateClonesCount);
    
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      window.removeEventListener('resize', updateClonesCount);
    };
  }, [updateClonesCount]);

  // تحديث عدد النسخ عند تغير المحتوى (segments)
  useEffect(() => {
    updateClonesCount();
  }, [segments, updateClonesCount]);

  // تعيين متغير CSS لسرعة الحركة
  useEffect(() => {
    if (wrapperRef.current) {
      wrapperRef.current.style.setProperty('--marquee-duration', `${speed}s`);
    }
  }, [speed]);

  // توليد مصفوفة النسخ بناءً على العدد المطلوب
  const clones = useMemo(() => {
    const items = [];
    for (let i = 0; i < clonesCount; i++) {
      items.push(renderContent(`clone-${i}`));
    }
    return items;
  }, [clonesCount, renderContent]);

  return (
    <div className="navigation-bar ticker-bar">
      <div 
        ref={wrapperRef}
        className={`ticker-wrapper ${pauseOnHover ? 'pause-on-hover' : ''}`}
        style={{ 
          animation: `${animationName} var(--marquee-duration, 60s) linear infinite`,
        }}
      >
        {renderContent('original')}
        {clones}
      </div>
    </div>
  );
}