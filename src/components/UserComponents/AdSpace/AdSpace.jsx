// import { useState, useEffect } from 'react';
// import { db } from '../../../firebase';
// import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
// import './AdSpace.css';

// export default function AdSpace() {
//   const [ads, setAds] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [fade, setFade] = useState(true);
//   const [heroHeight, setHeroHeight] = useState(window.innerWidth <= 768 ? 140 : 160);

//   // جلب الإعلانات
//   useEffect(() => {
//     const fetchAds = async () => {
//       try {
//         const q = query(
//           collection(db, 'ads'),
//           where('isActive', '==', true),
//           orderBy('order', 'asc')
//         );
//         const snap = await getDocs(q);
//         const adsList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//         setAds(adsList);
//       } catch (err) {
//         console.error('خطأ في جلب الإعلانات:', err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchAds();
//   }, []);

//   // مراقبة تغير حجم النافذة لتحديث الارتفاع ديناميكياً ومنع CLS
//   useEffect(() => {
//     const updateHeight = () => {
//       setHeroHeight(window.innerWidth <= 768 ? 140 : 160);
//     };
//     window.addEventListener('resize', updateHeight);
//     return () => window.removeEventListener('resize', updateHeight);
//   }, []);

//   // التبديل التلقائي للإعلانات
//   useEffect(() => {
//     if (ads.length <= 1) return;
//     const interval = setInterval(() => {
//       setFade(false);
//       setTimeout(() => {
//         setCurrentIndex((prevIndex) => (prevIndex + 1) % ads.length);
//         setFade(true);
//       }, 200);
//     }, 10000);
//     return () => clearInterval(interval);
//   }, [ads.length]);

//   const goToPrevious = () => {
//     if (ads.length === 0) return;
//     setFade(false);
//     setTimeout(() => {
//       setCurrentIndex((prevIndex) => (prevIndex - 1 + ads.length) % ads.length);
//       setFade(true);
//     }, 200);
//   };

//   const goToNext = () => {
//     if (ads.length === 0) return;
//     setFade(false);
//     setTimeout(() => {
//       setCurrentIndex((prevIndex) => (prevIndex + 1) % ads.length);
//       setFade(true);
//     }, 200);
//   };

//   if (loading) return <div className="ad-space loading" aria-live="polite">جاري التحميل...</div>;
//   if (ads.length === 0) {
//     return (
//       <div className="ad-space">
//         <div className="ad-space__placeholder">
//           <span className="ad-space__placeholder-icon" aria-hidden="true">📢</span>
//           <p>مساحة إعلانية</p>
//           <small>سيتم عرض الإعلانات هنا قريباً</small>
//         </div>
//       </div>
//     );
//   }

//   const currentAd = ads[currentIndex];

//   return (
//     <div className="ad-space" aria-label="شريط الإعلانات المتحركة">
//       <div className="ad-space__slider">
//         {ads.length > 1 && (
//           <button className="ad-space__nav ad-space__nav--prev" onClick={goToPrevious} aria-label="إعلان سابق">
//             ‹
//           </button>
//         )}

//         <div
//           className={`ad-space__hero ${fade ? 'fade-in' : 'fade-out'}`}
//           style={{
//             backgroundImage: `url(${currentAd.imageUrl || currentAd.imageBase64})`,
//             height: `${heroHeight}px`,
//             width: '100%'
//           }}
//           role="img"
//           aria-label={currentAd.title}
//           // ✅ إضافة fetchpriority للصورة الأولى لتسريع التحميل (LCP)
// fetchPriority="high"
//         >
//           <div className="ad-space__overlay"></div>
//           <div className="ad-space__content">
//             <h3 className="ad-space__title">{currentAd.title}</h3>
//             {currentAd.description && <p className="ad-space__text">{currentAd.description}</p>}
//             {currentAd.link && (
//               <a
//                 href={currentAd.link}
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 className="ad-space__button"
//                 aria-label={`اكتشف المزيد عن ${currentAd.title}`}
//               >
//                 اكتشف المزيد →
//               </a>
//             )}
//           </div>
//         </div>

//         {ads.length > 1 && (
//           <button className="ad-space__nav ad-space__nav--next" onClick={goToNext} aria-label="إعلان تالي">
//             ›
//           </button>
//         )}
//       </div>
//     </div>
//   );
// }


import { useState, useEffect, useRef } from 'react';
import { db } from '../../../firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import './AdSpace.css';

export default function AdSpace() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const autoInterval = useRef(null);

  // Fetch ads from Firestore
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
      } catch (err) {
        console.error('Error fetching ads:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAds();
  }, []);

  // Auto-slide
  useEffect(() => {
    if (ads.length <= 1) return;
    autoInterval.current = setInterval(() => {
      goToNext();
    }, 10000);
    return () => clearInterval(autoInterval.current);
  }, [ads.length, currentIndex]);

  const goToPrev = () => {
    if (isTransitioning || ads.length === 0) return;
    setIsTransitioning(true);
    setCurrentIndex(prev => (prev - 1 + ads.length) % ads.length);
    setTimeout(() => setIsTransitioning(false), 400);
  };

  const goToNext = () => {
    if (isTransitioning || ads.length === 0) return;
    setIsTransitioning(true);
    setCurrentIndex(prev => (prev + 1) % ads.length);
    setTimeout(() => setIsTransitioning(false), 400);
  };

  const goToIndex = (idx) => {
    if (isTransitioning || idx === currentIndex) return;
    setIsTransitioning(true);
    setCurrentIndex(idx);
    setTimeout(() => setIsTransitioning(false), 400);
  };

  // Compute prev and next indices
  const prevIndex = (currentIndex - 1 + ads.length) % ads.length;
  const nextIndex = (currentIndex + 1) % ads.length;

  // Loading state
  if (loading) {
    return <div className="ad-space loading">جاري تحميل الإعلانات...</div>;
  }

  // Empty state
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

  // Single ad – simple centered banner
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

  // === 3D Carousel with center + side images ===
  return (
    <div className="ad-space carousel-3d">
      <div className="carousel-container">
        <div className="carousel-items">
          {/* Left (prev) image */}
          <div
            className={`carousel-item prev ${isTransitioning ? 'transitioning' : ''}`}
            style={{ backgroundImage: `url(${ads[prevIndex].imageUrl || ads[prevIndex].imageBase64})` }}
          >
            <div className="item-overlay"></div>
            <div className="item-content">
              <h4>{ads[prevIndex].title}</h4>
              <p>{ads[prevIndex].description}</p>
            </div>
          </div>

          {/* Center (current) image */}
          <div
            className={`carousel-item active ${isTransitioning ? 'transitioning' : ''}`}
            style={{ backgroundImage: `url(${ads[currentIndex].imageUrl || ads[currentIndex].imageBase64})` }}
          >
            <div className="item-overlay"></div>
            <div className="item-content">
              <h3>{ads[currentIndex].title}</h3>
              {ads[currentIndex].description && <p>{ads[currentIndex].description}</p>}
              {ads[currentIndex].link && (
                <a href={ads[currentIndex].link} target="_blank" rel="noopener noreferrer" className="btn">اكتشف المزيد →</a>
              )}
            </div>
          </div>

          {/* Right (next) image */}
          <div
            className={`carousel-item next ${isTransitioning ? 'transitioning' : ''}`}
            style={{ backgroundImage: `url(${ads[nextIndex].imageUrl || ads[nextIndex].imageBase64})` }}
          >
            <div className="item-overlay"></div>
            <div className="item-content">
              <h4>{ads[nextIndex].title}</h4>
              <p>{ads[nextIndex].description}</p>
            </div>
          </div>
        </div>

        {/* Navigation buttons */}
        <button className="carousel-nav prev" onClick={goToPrev} aria-label="السابق">‹</button>
        <button className="carousel-nav next" onClick={goToNext} aria-label="التالي">›</button>

        {/* Dots indicator */}
        <div className="carousel-dots">
          {ads.map((_, idx) => (
            <button
              key={idx}
              className={`dot ${idx === currentIndex ? 'active' : ''}`}
              onClick={() => goToIndex(idx)}
              aria-label={`انتقل إلى الإعلان ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}