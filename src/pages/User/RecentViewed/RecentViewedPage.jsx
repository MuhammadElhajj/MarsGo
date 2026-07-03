// src/pages/User/RecentViewed/RecentViewedPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { getRecentlyViewed } from '../../../services/recentlyViewedService';
import GoBackButton from '../../../components/GeneralComponents/GoBackButton/GoBackButton';
import { FiMonitor, FiSmartphone, FiFilter } from 'react-icons/fi';
import './RecentViewedPage.css';

export default function RecentViewedPage() {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'game', 'app'
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

  const filteredItems = items.filter(item => {
    if (filter === 'all') return true;
    return item.type === filter;
  });

  const handleItemClick = (item) => {
    if (item.link) {
      navigate(item.link);
    } else if (item.type === 'game') {
      navigate(`/gaming/game/${item.id}`);
    } else if (item.type === 'app') {
      navigate(`/apps/app/${item.id}`);
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <div className="recent-viewed-page loading">جاري التحميل...</div>;
  }

  return (
    <div className="recent-viewed-page" dir="rtl">
      

      <div className="recent-viewed-page__filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          <FiFilter /> الكل ({items.length})
        </button>
        <button
          className={`filter-btn ${filter === 'game' ? 'active' : ''}`}
          onClick={() => setFilter('game')}
        >
          <FiMonitor /> ألعاب ({items.filter(i => i.type === 'game').length})
        </button>
        <button
          className={`filter-btn ${filter === 'app' ? 'active' : ''}`}
          onClick={() => setFilter('app')}
        >
          <FiSmartphone /> تطبيقات ({items.filter(i => i.type === 'app').length})
        </button>
      </div>

      {filteredItems.length === 0 ? (
        <div className="recent-viewed-page__empty">
          <span>📭</span>
          <p>لا توجد زيارات مسجلة</p>
          <p className="empty-hint">زر الألعاب والتطبيقات لتسجيل زياراتك</p>
        </div>
      ) : (
        <div className="recent-viewed-page__list">
          {filteredItems.map((item) => (
            <div
              key={`${item.id}-${item.type}`}
              className="recent-viewed-page__item"
              onClick={() => handleItemClick(item)}
            >
              <div className="recent-viewed-page__item-icon">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} loading="lazy" />
                ) : (
                  <span className="icon-placeholder">
                    {item.type === 'game' ? <FiMonitor size={24} /> : <FiSmartphone size={24} />}
                  </span>
                )}
              </div>
              <div className="recent-viewed-page__item-info">
                <span className="item-name">{item.name}</span>
                <span className="item-category">
                  {item.type === 'game' ? '🎮 لعبة' : '📱 تطبيق'}
                </span>
              </div>
              <div className="recent-viewed-page__item-date">
                {formatDate(item.viewedAt)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}