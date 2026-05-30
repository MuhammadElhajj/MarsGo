import { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import './AdSpace.css';

export default function AdSpace() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fade, setFade] = useState(true); // للتحكم في تأثير التلاشي

  // جلب الإعلانات النشطة وترتيبها
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

  // التبديل التلقائي كل 5 ثوانٍ مع تأثير التلاشي
  useEffect(() => {
    if (ads.length <= 1) return;
    const interval = setInterval(() => {
      setFade(false); // إخفاء سريع
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % ads.length);
        setFade(true); // إظهار مع تلاشي
      }, 200);
    }, 10000);
    return () => clearInterval(interval);
  }, [ads.length]);

  // الانتقال إلى الإعلان السابق
  const goToPrevious = () => {
    if (ads.length === 0) return;
    setFade(false);
    setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex - 1 + ads.length) % ads.length);
      setFade(true);
    }, 200);
  };

  // الانتقال إلى الإعلان التالي
  const goToNext = () => {
    if (ads.length === 0) return;
    setFade(false);
    setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % ads.length);
      setFade(true);
    }, 200);
  };

  // الانتقال إلى إعلان محدد بالنقر على النقطة
  const goToSlide = (index) => {
    if (index === currentIndex) return;
    setFade(false);
    setTimeout(() => {
      setCurrentIndex(index);
      setFade(true);
    }, 200);
  };

  if (loading) return <div className="ad-space loading">جاري التحميل...</div>;
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

  const currentAd = ads[currentIndex];

  return (
    <div className="ad-space">
      <div className="ad-space__slider">
        {ads.length > 1 && (
          <button className="ad-space__nav ad-space__nav--prev" onClick={goToPrevious} aria-label="إعلان سابق">
            ‹
          </button>
        )}

        <div
          className={`ad-space__hero ${fade ? 'fade-in' : 'fade-out'}`}
          style={{ backgroundImage: `url(${currentAd.imageBase64})` }}
        >
          <div className="ad-space__overlay"></div>
          <div className="ad-space__content">
            <h3 className="ad-space__title">{currentAd.title}</h3>
            {currentAd.description && <p className="ad-space__text">{currentAd.description}</p>}
            {currentAd.link && (
              <a href={currentAd.link} target="_blank" rel="noopener noreferrer" className="ad-space__button">
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

      {/* </div> */}
      {ads.length > 1 && (
        <div className="ad-space__dots">
          {ads.map((_, idx) => (
            <button
              key={idx}
              className={`ad-space__dot ${idx === currentIndex ? 'active' : ''}`}
              onClick={() => goToSlide(idx)}
              aria-label={`انتقل إلى الإعلان ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
    </div>
  );
}