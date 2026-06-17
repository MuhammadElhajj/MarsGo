// src/pages/User/LeaderboardPage/LeaderboardPage.jsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiAward, FiUser, FiTrendingUp, FiHeart, 
  FiHash, FiLoader, FiShield, FiZap
} from 'react-icons/fi';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
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

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  // ===== جلب المستخدمين من Firestore =====
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'users'), orderBy('power', 'desc'));
        const snapshot = await getDocs(q);
        const usersList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          name: doc.data().name || doc.data().displayName || 'مستخدم',
          avatar: doc.data().avatar || doc.data().photoURL || null,
          power: doc.data().power || 0,
          popularity: doc.data().popularity || 0,
          wins: doc.data().wins || 0,
          rank: doc.data().rank || 'عضو',
        }));
        setUsers(usersList);
      } catch (error) {
        console.error('خطأ في جلب المتصدرين:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // ===== الترتيب حسب الفلتر =====
  const sortedUsers = useMemo(() => {
    const list = [...users];
    switch (filter) {
      case 'power':
        return list.sort((a, b) => b.power - a.power);
      case 'popularity':
        return list.sort((a, b) => b.popularity - a.popularity);
      case 'wins':
        return list.sort((a, b) => b.wins - a.wins);
      default:
        return list.sort((a, b) => (b.power + b.popularity) - (a.power + a.popularity));
    }
  }, [users, filter]);

  // ===== التنقل إلى صفحة البروفايل =====
  const handleUserClick = (userId) => {
    navigate(`/profile/${userId}`);
  };

  // ===== حالة التحميل =====
  if (loading) {
    return (
      <div className="leaderboard-page leaderboard-loading">
        <FiLoader className="loading-spinner" />
        <p>جاري تحميل قائمة المتصدرين...</p>
      </div>
    );
  }

  return (
    <div className="leaderboard-page">
      {/* الهيدر */}
      <div className="leaderboard__header">
        <h2>
          <FiAward className="header-icon" />
          قائمة المتصدرين
        </h2>
        <p>ترتيب الأكثر تأثيراً ونشاطاً في المنصة</p>
      </div>

      {/* أزرار التصفية */}
      <div className="leaderboard__filters">
        <button 
          className={filter === 'all' ? 'active' : ''} 
          onClick={() => setFilter('all')}
        >
          <FiTrendingUp /> الترتيب العام
        </button>
        <button 
          className={filter === 'power' ? 'active' : ''} 
          onClick={() => setFilter('power')}
        >
          <FiZap /> نقاط القوة
        </button>
        <button 
          className={filter === 'popularity' ? 'active' : ''} 
          onClick={() => setFilter('popularity')}
        >
          <FiHeart /> الشعبية
        </button>
        <button 
          className={filter === 'wins' ? 'active' : ''} 
          onClick={() => setFilter('wins')}
        >
          <FiAward /> عدد الانتصارات
        </button>
      </div>

      {/* قائمة المتصدرين */}
      <div className="leaderboard__list">
        {sortedUsers.length === 0 ? (
          <p className="leaderboard__empty">لا يوجد مستخدمون مسجلون بعد</p>
        ) : (
          sortedUsers.map((user, index) => (
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
              {/* المركز */}
              <div className="leaderboard__rank">
                {getMedalIcon(index)}
                <span>#{index + 1}</span>
              </div>

              {/* الصورة الرمزية */}
              <div className="leaderboard__avatar">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="avatar-img" />
                ) : (
                  <FiUser />
                )}
              </div>

              {/* معلومات المستخدم */}
              <div className="leaderboard__info">
                <div className="leaderboard__name">
                  {user.name}
                  <span className="leaderboard__rank-badge">{user.rank}</span>
                </div>
                <div className="leaderboard__stats">
                  <span className="stat"><FiZap /> {user.power}</span>
                  <span className="stat"><FiHeart /> {user.popularity}</span>
                  <span className="stat"><FiAward /> {user.wins}</span>
                </div>
              </div>

              {/* اللقب الرسمي للثلاثة الأوائل */}
              {index < 3 && (
                <div className="leaderboard__badge">
                  <FiShield /> {getOfficialTitle(index)}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* الفوتر */}
      <div className="leaderboard__footer">
        <p>إجمالي المتصدرين: <strong>{sortedUsers.length}</strong> مستخدم</p>
        <p>يتم تحديث الترتيب تلقائياً بناءً على النشاط</p>
      </div>
    </div>
  );
}