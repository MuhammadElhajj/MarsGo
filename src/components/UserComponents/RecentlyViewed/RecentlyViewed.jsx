// src/components/UserComponents/RecentlyViewed/RecentlyViewed.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { getRecentlyViewed } from '../../../services/recentlyViewedService';
import { FiMonitor, FiSmartphone } from 'react-icons/fi';
import './RecentlyViewed.css';

export default function RecentlyViewed() {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData?.email) {
      setLoading(false);
      return;
    }

    const viewed = getRecentlyViewed(userData.email);
    setItems(viewed);
    setLoading(false);
  }, [userData?.email]);

  if (loading) {
    return <div className="recently-viewed loading">جاري التحميل...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="recently-viewed empty">
        <div className="recently-viewed__empty-icon">🕒</div>
        <p className="recently-viewed__empty-text">لم تزر أي لعبة أو تطبيق بعد</p>
      </div>
    );
  }

  // ✅ عرض آخر زيارتين فقط
  const recentItems = items.slice(0, 3);

  const handleItemClick = (item) => {
    if (item.link) {
      navigate(item.link);
    } else if (item.type === 'game') {
      navigate(`/gaming/game/${item.id}`);
    } else if (item.type === 'app') {
      navigate(`/apps/app/${item.id}`);
    }
  };

  return (
    <div className="recently-viewed">
      <div className="recently-viewed__header">
        <h3 className="recently-viewed__title">🕒 آخر ما شاهدت</h3>
        {items.length > 2 && (
          <button
            className="recently-viewed__more-btn"
            onClick={() => navigate('/recent-viewed')}
          >
            المزيد →
          </button>
        )}
      </div>
      <div className="recently-viewed__list">
        {recentItems.map((item) => (
          <div
            key={`${item.id}-${item.type}`}
            className="recently-viewed__item"
            onClick={() => handleItemClick(item)}
          >
            <div className="recently-viewed__item-icon">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} loading="lazy" />
              ) : (
                <span className="recently-viewed__item-icon-placeholder">
                  {item.type === 'game' ? <FiMonitor size={20} /> : <FiSmartphone size={20} />}
                </span>
              )}
            </div>
            <div className="recently-viewed__item-info">
              <span className="recently-viewed__item-name">{item.name}</span>
              <span className="recently-viewed__item-category">
                {item.type === 'game' ? 'لعبة' : 'تطبيق'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}