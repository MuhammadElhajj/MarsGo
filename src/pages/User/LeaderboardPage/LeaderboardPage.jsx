// src/pages/User/LeaderboardPage/LeaderboardPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiAward, FiUser, FiTrendingUp, FiHeart, 
  FiHash, FiLoader, FiShield, FiZap
} from 'react-icons/fi';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';
import './LeaderboardPage.css';

// ===== أيقونات الميداليات =====
const getMedalIcon = (index) => {
  switch (index) {
    case 0: return <FiAward className="medal gold" />;
    case 1: return <FiAward className="medal silver" />;
    case 2: return <FiAward className="medal bronze" />;
    default: return <FiHash className="medal default" />;
  }
};

// ===== الألقاب الرسمية للمراكز الأولى =====
const getOfficialTitle = (index) => {
  switch (index) {
    case 0: return 'الملك الذهبي';
    case 1: return 'الوصي الأول';
    case 2: return 'الحامي البرونزي';
    default: return null;
  }
};

// ===== تحديد لون البطاقة =====
const getCardClass = (index) => {
  if (index === 0) return 'leaderboard__item gold';
  if (index === 1) return 'leaderboard__item silver';
  if (index === 2) return 'leaderboard__item bronze';
  return 'leaderboard__item';
};

// ===== جلب المستخدمين (أول 10) حسب الحقل المطلوب =====
const fetchTopUsers = async (field) => {
  try {
    const q = query(
      collection(db, 'users'),
      orderBy(field, 'desc'),
      limit(10)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      name: doc.data().name || doc.data().displayName || 'مستخدم',
      avatar: doc.data().avatar || doc.data().photoURL || null,
      power: doc.data().power || 0,
      popularity: doc.data().popularity || 0,
      wins: doc.data().wins || 0,
      level: doc.data().level || 1,
      rank: doc.data().rank || 'عضو',
    }));
  } catch (error) {
    console.error('خطأ في جلب المتصدرين:', error);
    return [];
  }
};

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('popularity');

  // ===== جلب البيانات عند تغيير الفلتر =====
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      // نحدد الحقل الذي سنفرز عليه
      let orderField = 'popularity';
      if (filter === 'power') orderField = 'power';
      else if (filter === 'wins') orderField = 'wins';
      // بالنسبة لـ 'all' نستخدم popularity مؤقتاً (أو يمكن إضافة totalScore لاحقاً)
      else if (filter === 'all') orderField = 'popularity';

      const usersList = await fetchTopUsers(orderField);
      setUsers(usersList);
      setLoading(false);
    };

    loadData();
  }, [filter]);

  const handleUserClick = (userId) => {
    navigate(`/profile/${userId}`);
  };

  if (loading) {
    return (
      <div className="leaderboard-loading">
        <FiLoader className="loading-spinner" />
        <p>جاري تحميل قائمة المتصدرين...</p>
      </div>
    );
  }

  return (
    <div className="leaderboard-page">
      <div className="leaderboard__back">
      
      </div>

      <div className="leaderboard__filters">
        <button 
          className={filter === 'popularity' ? 'active' : ''} 
          onClick={() => setFilter('popularity')}
        >
          <FiHeart /> الشعبية
        </button>
        <button 
          className={filter === 'power' ? 'active' : ''} 
          onClick={() => setFilter('power')}
        >
          <FiZap /> نقاط القوة
        </button>
        <button 
          className={filter === 'wins' ? 'active' : ''} 
          onClick={() => setFilter('wins')}
        >
          <FiAward /> الانتصارات
        </button>
        <button 
          className={filter === 'all' ? 'active' : ''} 
          onClick={() => setFilter('all')}
        >
          <FiTrendingUp /> الترتيب العام
        </button>
      </div>

      <div className="leaderboard__list">
        {users.length === 0 ? (
          <p className="leaderboard__empty">لا يوجد مستخدمون مسجلون بعد</p>
        ) : (
          users.map((user, index) => (
            <div 
              key={user.id} 
              className={getCardClass(index)}
              onClick={() => handleUserClick(user.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleUserClick(user.id);
                }
              }}
            >
              <div className="leaderboard__rank">
                {getMedalIcon(index)}
                <span>#{index + 1}</span>
              </div>

              <div className="leaderboard__avatar">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="avatar-img" />
                ) : (
                  <FiUser />
                )}
              </div>

              <div className="leaderboard__info">
                <div className="leaderboard__name">
                  {user.name}
                  <span className="leaderboard__rank-badge">{user.rank}</span>
                </div>
                <div className="leaderboard__stats">
                  <span className="stat"><FiHeart /> {user.popularity}</span>
                  <span className="stat"><FiZap /> {user.power}</span>
                  <span className="stat"><FiAward /> {user.wins}</span>
                </div>
              </div>

              {index < 3 && (
                <div className="leaderboard__badge">
                  <FiShield /> {getOfficialTitle(index)}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="leaderboard__footer">
        <p>إجمالي المتصدرين: <strong>{users.length}</strong> مستخدم</p>
        <p>يتم تحديث الترتيب تلقائياً بناءً على الشعبية والنشاط</p>
      </div>
    </div>
  );
}