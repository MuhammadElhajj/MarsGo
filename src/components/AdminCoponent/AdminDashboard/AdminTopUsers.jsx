// src/components/AdminCoponent/AdminDashboard/AdminTopUsers.jsx
import { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { FiUser, FiStar, FiTrendingUp } from 'react-icons/fi';
import './AdminTopUsers.css';

export default function AdminTopUsers({ period }) {
  const [topUsers, setTopUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopUsers = async () => {
      setLoading(true);
      try {
        // جلب جميع المستخدمين
        const usersSnap = await getDocs(collection(db, 'users'));
        const users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // جلب عدد الطلبات لكل مستخدم
        const ordersSnap = await getDocs(collection(db, 'orders'));
        const orders = ordersSnap.docs.map(doc => doc.data());

        // حساب عدد الطلبات لكل مستخدم
        const userOrderCount = {};
        orders.forEach(order => {
          const userId = order.userId;
          if (userId) {
            userOrderCount[userId] = (userOrderCount[userId] || 0) + 1;
          }
        });

        // دمج البيانات وترتيبها
        const usersWithStats = users.map(user => ({
          ...user,
          orderCount: userOrderCount[user.id] || 0,
          popularity: user.popularity || 0,
        }));

        // ترتيب حسب عدد الطلبات تنازلياً
        const sorted = usersWithStats
          .filter(u => u.orderCount > 0)
          .sort((a, b) => b.orderCount - a.orderCount)
          .slice(0, 10);

        setTopUsers(sorted);
      } catch (err) {
        console.error('خطأ في جلب المستخدمين الأكثر نشاطاً:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTopUsers();
  }, [period]);

  if (loading) {
    return <div className="admin-top-users-loading">جاري التحميل...</div>;
  }

  return (
    <div className="admin-top-users">
      <h3>🏆 المستخدمين الأكثر نشاطاً</h3>
      {topUsers.length === 0 ? (
        <p className="top-users-empty">لا يوجد مستخدمين نشطين</p>
      ) : (
        <div className="top-users-list">
          {topUsers.map((user, index) => (
            <div key={user.id} className="top-user-item">
              <div className="top-user-item__rank">
                {index === 0 && <span className="rank-medal gold">🥇</span>}
                {index === 1 && <span className="rank-medal silver">🥈</span>}
                {index === 2 && <span className="rank-medal bronze">🥉</span>}
                {index > 2 && <span className="rank-number">#{index + 1}</span>}
              </div>
              <div className="top-user-item__avatar">
                <img src={user.avatar || '/default-avatar.png'} alt={user.name} />
              </div>
              <div className="top-user-item__info">
                <div className="top-user-item__name">{user.name || 'مستخدم'}</div>
                <div className="top-user-item__stats">
                  <span><FiShoppingBag /> {user.orderCount} طلب</span>
                  <span><FiStar /> {user.popularity || 0} شعبية</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}