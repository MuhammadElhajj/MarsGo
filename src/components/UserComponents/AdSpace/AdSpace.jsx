// src/components/UserComponents/AdSpace/AdSpace.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '../../../firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import './AdSpace.css';

export default function AdSpace() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const autoInterval = useRef(null);
  const imageCache = useRef({});

  // جلب الإعلانات من Firestore
  useEffect(() => {
    const fetchAds = async () => {
      try {
        const q = query(
          collection(db, 'ads'),
          where('isActive', '==', true),
          orderBy('order', 'asc')
        );
        const snapshot = await getDocs(q);
        const adsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAds(adsList);
        // Preload images
        adsList.forEach(ad => {
          if (ad.imageUrl && !imageCache.current[ad.imageUrl]) {
            const img = new Image();
            img.src = ad.imageUrl;
            imageCache.current[ad.imageUrl] = img;
          }
        });
      } catch (err) {
        console.error('Error fetching ads:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAds();
  }, []);

  // التبديل التلقائي
  useEffect(() => {
    if (ads.length <= 1) return;
    autoInterval.current = setInterval(() => {
      goToNext();
    }, 6000);
    return () => clearInterval(autoInterval.current);
  }, [ads.length, currentIndex]);

  const goToNext = useCallback(() => {
    if (isTransitioning || ads.length === 0) return;
    setIsTransitioning(true);
    setCurrentIndex(prev => (prev + 1) % ads.length);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning, ads.length]);

  const goToIndex = useCallback((idx) => {
    if (isTransitioning || idx === currentIndex) return;
    setIsTransitioning(true);
    setCurrentIndex(idx);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning, currentIndex]);

  // حالة التحميل
  if (loading) {
    return <div className="ad-space loading">جاري تحميل الإعلانات...</div>;
  }

  // لا توجد إعلانات
  if (ads.length === 0) {
    return (
      <div className="ad-space">
        <div className="ad-space__placeholder">
          <span className="ad-space__placeholder-icon">📢</span>
          <p>مساحة إعلانية</p>
          <small>سيتم عرض الإعلانات هنا قريباً</small>
        </div>
      </div>
    );
  }

  // إعلان واحد فقط
  if (ads.length === 1) {
    const ad = ads[0];
    return (
      <div className="ad-space single">
        <div
          className="single-ad"
          style={{ backgroundImage: `url(${ad.imageUrl || ad.imageBase64})` }}
        >
          <div className="single-overlay"></div>
          <div className="single-content">
            <h3>{ad.title}</h3>
            {ad.description && <p>{ad.description}</p>}
            {ad.link && (
              <a href={ad.link} target="_blank" rel="noopener noreferrer" className="btn">اكتشف المزيد →</a>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ✅ إعلانات متعددة – عرض مبسط مع نقاط تفاعلية
  const currentAd = ads[currentIndex];
  const imageUrl = currentAd.imageUrl || currentAd.imageBase64;

  return (
    <div className="ad-space">
      <div className="ad-space__banner">
        {/* صورة الخلفية مع تحسين الأداء */}
        <img
          src={imageUrl}
          alt={currentAd.title || 'إعلان'}
          className="ad-space__banner-image"
          loading="lazy"
          decoding="async"
          width="1200"
          height="400"
        />
        {/* طبقة التعتيم */}
        <div className="ad-space__overlay"></div>
        {/* المحتوى النصي */}
        <div className="ad-space__content">
          <h3 className="ad-space__title">{currentAd.title}</h3>
          {currentAd.description && (
            <p className="ad-space__text">{currentAd.description}</p>
          )}
          {currentAd.link && (
            <a
              href={currentAd.link}
              target="_blank"
              rel="noopener noreferrer"
              className="ad-space__button"
            >
              اكتشف المزيد →
            </a>
          )}
        </div>
        {/* النقاط التفاعلية في الأسفل */}
        <div className="ad-space__dots">
          {ads.map((_, idx) => (
            <button
              key={idx}
              className={`ad-space__dot ${idx === currentIndex ? 'active' : ''}`}
              onClick={() => goToIndex(idx)}
              aria-label={`اذهب إلى الإعلان ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}