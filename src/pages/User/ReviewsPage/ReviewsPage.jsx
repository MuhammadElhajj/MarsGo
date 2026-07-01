// src/pages/User/ReviewsPage/ReviewsPage.jsx
import { useState, useEffect } from 'react';
import { useAppStore } from '../../../store/store';
import { useAuth } from '../../../context/AuthContext';
import GoBackButton from '../../../components/GeneralComponents/GoBackButton/GoBackButton';
import { FaStar, FaRegStar } from 'react-icons/fa';
import { FiUsers, FiShoppingBag, FiGrid, FiUser, FiClock } from 'react-icons/fi';
import './ReviewsPage.css';

// ===== بيانات وهمية (سيتم استبدالها بـ Firestore لاحقاً) =====
const MOCK_REVIEWS = [
  {
    id: '1',
    userId: 'u1',
    userName: 'أحمد محمد',
    userAvatar: null,
    targetType: 'game',
    targetName: 'PUBG Mobile',
    targetId: 'g1',
    rating: 5,
    comment: 'خدمة ممتازة وسريعة، أنصح بها بشدة!',
    createdAt: new Date('2026-06-15T10:30:00'),
  },
  {
    id: '2',
    userId: 'u2',
    userName: 'سارة علي',
    userAvatar: null,
    targetType: 'app',
    targetName: 'Spotify',
    targetId: 'a1',
    rating: 4,
    comment: 'التطبيق يعمل بشكل جيد، لكن السعر مرتفع قليلاً.',
    createdAt: new Date('2026-06-14T14:20:00'),
  },
  {
    id: '3',
    userId: 'u3',
    userName: 'خالد حسن',
    userAvatar: null,
    targetType: 'user',
    targetName: 'محمد الحاج',
    targetId: 'u4',
    rating: 5,
    comment: 'مدقق محترف جداً، تعامل راقي ووقت استجابة سريع.',
    createdAt: new Date('2026-06-12T09:15:00'),
  },
  {
    id: '4',
    userId: 'u4',
    userName: 'منى عبدالله',
    userAvatar: null,
    targetType: 'game',
    targetName: 'Free Fire',
    targetId: 'g2',
    rating: 3,
    comment: 'الخدمة جيدة ولكن تأخرت قليلاً في التنفيذ.',
    createdAt: new Date('2026-06-10T16:45:00'),
  },
  {
    id: '5',
    userId: 'u5',
    userName: 'يوسف سليمان',
    userAvatar: null,
    targetType: 'app',
    targetName: 'Netflix',
    targetId: 'a2',
    rating: 5,
    comment: 'أفضل خدمة اشتراك في الموقع، سعر ممتاز وجودة عالية.',
    createdAt: new Date('2026-06-08T11:00:00'),
  },
];

export default function ReviewsPage() {
  const { userData } = useAuth();
  const { addMgcBalance } = useAppStore();

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'game' | 'app' | 'user'
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ average: 0, count: 0 });

  // محاكاة تحميل البيانات
  useEffect(() => {
    const loadReviews = () => {
      // هنا سيتم جلب البيانات من Firestore
      // حالياً نستخدم البيانات الوهمية
      setReviews(MOCK_REVIEWS);
      const total = MOCK_REVIEWS.length;
      const avg = MOCK_REVIEWS.reduce((sum, r) => sum + r.rating, 0) / total;
      setStats({ average: parseFloat(avg.toFixed(1)), count: total });
      setLoading(false);
    };
    loadReviews();
  }, []);

  // تصفية التقييمات حسب التبويب
  const filteredReviews = reviews.filter(review => {
    if (activeTab === 'all') return true;
    return review.targetType === activeTab;
  });

  // دالة عرض النجوم
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        i <= rating ? (
          <FaStar key={i} className="star star-filled" />
        ) : (
          <FaRegStar key={i} className="star star-empty" />
        )
      );
    }
    return stars;
  };

  // دالة تنسيق التاريخ
  const formatDate = (date) => {
    return date.toLocaleDateString('ar-EG', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // دالة الحصول على أيقونة النوع
  const getTypeIcon = (type) => {
    switch (type) {
      case 'game': return <FiGrid className="type-icon" style={{ color: '#8b5cf6' }} />;
      case 'app': return <FiShoppingBag className="type-icon" style={{ color: '#3b82f6' }} />;
      case 'user': return <FiUser className="type-icon" style={{ color: '#10b981' }} />;
      default: return <FiGrid className="type-icon" />;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'game': return 'لعبة';
      case 'app': return 'تطبيق';
      case 'user': return 'مستخدم';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="reviews-page-loading">
        <div className="loading-spinner"></div>
        <p>جاري تحميل التقييمات...</p>
      </div>
    );
  }

  return (
    <div className="reviews-page" dir="rtl">
      {/* ===== الهيدر ===== */}
      <div className="reviews-page__header">
       
        <h1 className="reviews-page__title">
          <FaStar className="header-icon" style={{ color: '#f59e0b' }} />
          التقييمات والمراجعات
        </h1>
      </div>

      {/* ===== الإحصائيات ===== */}
      <div className="reviews-page__stats">
        <div className="stat-item">
          <span className="stat-value">{stats.average}</span>
          <div className="stat-stars">
            {renderStars(Math.round(stats.average))}
          </div>
          <span className="stat-label">متوسط التقييم</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{stats.count}</span>
          <span className="stat-label">عدد التقييمات</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">
            {reviews.filter(r => r.rating >= 4).length}
          </span>
          <span className="stat-label">تقييمات إيجابية</span>
        </div>
      </div>

      {/* ===== التبويبات ===== */}
      <div className="reviews-page__tabs">
        <button
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <FiGrid /> الكل ({reviews.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'game' ? 'active' : ''}`}
          onClick={() => setActiveTab('game')}
        >
          <FiGrid /> ألعاب ({reviews.filter(r => r.targetType === 'game').length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'app' ? 'active' : ''}`}
          onClick={() => setActiveTab('app')}
        >
          <FiShoppingBag /> تطبيقات ({reviews.filter(r => r.targetType === 'app').length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'user' ? 'active' : ''}`}
          onClick={() => setActiveTab('user')}
        >
          <FiUser /> مستخدمين ({reviews.filter(r => r.targetType === 'user').length})
        </button>
      </div>

      {/* ===== قائمة التقييمات ===== */}
      <div className="reviews-page__list">
        {filteredReviews.length === 0 ? (
          <div className="empty-state">
            <p>لا توجد تقييمات في هذا التصنيف</p>
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div key={review.id} className="review-card">
              <div className="review-card__header">
                <div className="review-card__user">
                  <div className="user-avatar">
                    {review.userAvatar ? (
                      <img src={review.userAvatar} alt={review.userName} />
                    ) : (
                      <span className="avatar-placeholder">
                        {review.userName.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="user-info">
                    <span className="user-name">{review.userName}</span>
                    <span className="user-target">
                      {getTypeIcon(review.targetType)}
                      {review.targetName}
                      <span className="target-type">({getTypeLabel(review.targetType)})</span>
                    </span>
                  </div>
                </div>
                <div className="review-card__rating">
                  <div className="stars">{renderStars(review.rating)}</div>
                  <span className="rating-number">{review.rating}/5</span>
                </div>
              </div>

              <div className="review-card__body">
                <p className="review-comment">{review.comment}</p>
              </div>

              <div className="review-card__footer">
                <span className="review-date">
                  <FiClock style={{ marginLeft: '0.3rem', fontSize: '0.8rem' }} />
                  {formatDate(review.createdAt)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}