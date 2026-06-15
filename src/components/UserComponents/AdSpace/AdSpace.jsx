


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