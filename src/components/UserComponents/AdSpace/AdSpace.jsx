import { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import './AdSpace.css';

export default function AdSpace() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [heroHeight, setHeroHeight] = useState(window.innerWidth <= 768 ? 140 : 160);

  // جلب الإعلانات
  useEffect(() => {
    const fetchAds = async () => {
      try {
        const q = query(
          collection(db, 'ads'),
          where('isActive', '==', true),
          orderBy('order', 'asc')
        );
        const snap = await getDocs(q);
        const adsList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAds(adsList);
      } catch (err) {
        console.error('خطأ في جلب الإعلانات:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAds();
  }, []);

  // مراقبة تغير حجم النافذة لتحديث الارتفاع ديناميكياً ومنع CLS
  useEffect(() => {
    const updateHeight = () => {
      setHeroHeight(window.innerWidth <= 768 ? 140 : 160);
    };
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // التبديل التلقائي للإعلانات
  useEffect(() => {
    if (ads.length <= 1) return;
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % ads.length);
        setFade(true);
      }, 200);
    }, 10000);
    return () => clearInterval(interval);
  }, [ads.length]);

  const goToPrevious = () => {
    if (ads.length === 0) return;
    setFade(false);
    setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex - 1 + ads.length) % ads.length);
      setFade(true);
    }, 200);
  };

  const goToNext = () => {
    if (ads.length === 0) return;
    setFade(false);
    setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % ads.length);
      setFade(true);
    }, 200);
  };

  if (loading) return <div className="ad-space loading" aria-live="polite">جاري التحميل...</div>;
  if (ads.length === 0) {
    return (
      <div className="ad-space">
        <div className="ad-space__placeholder">
          <span className="ad-space__placeholder-icon" aria-hidden="true">📢</span>
          <p>مساحة إعلانية</p>
          <small>سيتم عرض الإعلانات هنا قريباً</small>
        </div>
      </div>
    );
  }

  const currentAd = ads[currentIndex];

  return (
    <div className="ad-space" aria-label="شريط الإعلانات المتحركة">
      <div className="ad-space__slider">
        {ads.length > 1 && (
          <button className="ad-space__nav ad-space__nav--prev" onClick={goToPrevious} aria-label="إعلان سابق">
            ‹
          </button>
        )}

        <div
          className={`ad-space__hero ${fade ? 'fade-in' : 'fade-out'}`}
          style={{
            backgroundImage: `url(${currentAd.imageUrl || currentAd.imageBase64})`,
            height: `${heroHeight}px`,
            width: '100%'
          }}
          role="img"
          aria-label={currentAd.title}
          // ✅ إضافة fetchpriority للصورة الأولى لتسريع التحميل (LCP)
fetchPriority="high"
        >
          <div className="ad-space__overlay"></div>
          <div className="ad-space__content">
            <h3 className="ad-space__title">{currentAd.title}</h3>
            {currentAd.description && <p className="ad-space__text">{currentAd.description}</p>}
            {currentAd.link && (
              <a
                href={currentAd.link}
                target="_blank"
                rel="noopener noreferrer"
                className="ad-space__button"
                aria-label={`اكتشف المزيد عن ${currentAd.title}`}
              >
                اكتشف المزيد →
              </a>
            )}
          </div>
        </div>

        {ads.length > 1 && (
          <button className="ad-space__nav ad-space__nav--next" onClick={goToNext} aria-label="إعلان تالي">
            ›
          </button>
        )}
      </div>
    </div>
  );
}