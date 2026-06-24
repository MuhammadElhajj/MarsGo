// src/components/AdminCoponent/AdminDashboard/AdminStatsCards.jsx
import { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, getCountFromServer, query, where, getDocs } from 'firebase/firestore';
import { FiUsers, FiUserCheck, FiUserX, FiUserPlus, FiShoppingBag, FiDollarSign, FiTrendingUp, FiClock } from 'react-icons/fi';
import './AdminStatsCards.css';

export default function AdminStatsCards({ period }) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    referrals: 0,
    referrers: 0,
    totalOrders: 0,
    completedOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    todayOrders: 0,
    weeklyOrders: 0,
    monthlyOrders: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        // عدد المستخدمين الكلي
        const usersSnap = await getCountFromServer(collection(db, 'users'));
        const totalUsers = usersSnap.data().count;

        // المستخدمين النشطين (الذين لديهم طلبات في آخر 30 يوم)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const activeUsersQuery = query(
          collection(db, 'orders'),
          where('createdAt', '>=', thirtyDaysAgo)
        );
        const activeUsersSnap = await getDocs(activeUsersQuery);
        const activeUserIds = new Set();
        activeUsersSnap.forEach(doc => activeUserIds.add(doc.data().userId));
        const activeUsers = activeUserIds.size;

        // المحالين (المستخدمين الذين لديهم referredBy)
        const referredQuery = query(collection(db, 'users'), where('referredBy', '!=', null));
        const referredSnap = await getCountFromServer(referredQuery);
        const referrals = referredSnap.data().count;

        // المُحيلين (المستخدمين الذين لديهم إحالات في referral_rewards)
        const referrersQuery = query(collection(db, 'referral_rewards'));
        const referrersSnap = await getDocs(referrersQuery);
        const referrerIds = new Set();
        referrersSnap.forEach(doc => referrerIds.add(doc.data().referrerId));
        const referrers = referrerIds.size;

        // الطلبات
        const ordersSnap = await getCountFromServer(collection(db, 'orders'));
        const totalOrders = ordersSnap.data().count;

        // الطلبات المكتملة
        const completedQuery = query(collection(db, 'orders'), where('status', '==', 'completed'));
        const completedSnap = await getCountFromServer(completedQuery);
        const completedOrders = completedSnap.data().count;

        // الطلبات المعلقة (غير مكتملة وغير مرفوضة)
        const pendingQuery = query(
          collection(db, 'orders'),
          where('status', 'not-in', ['completed', 'rejected'])
        );
        const pendingSnap = await getCountFromServer(pendingQuery);
        const pendingOrders = pendingSnap.data().count;

        // الإيرادات (مجموع الطلبات المكتملة)
        const completedOrdersSnap = await getDocs(
          query(collection(db, 'orders'), where('status', '==', 'completed'))
        );
        let totalRevenue = 0;
        completedOrdersSnap.forEach(doc => {
          const order = doc.data();
          const amount = order.finalPriceUSD || order.finalPrice || order.amount || 0;
          totalRevenue += amount;
        });

        // طلبات اليوم
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayQuery = query(
          collection(db, 'orders'),
          where('createdAt', '>=', today)
        );
        const todaySnap = await getCountFromServer(todayQuery);
        const todayOrders = todaySnap.data().count;

        // طلبات هذا الأسبوع
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekQuery = query(
          collection(db, 'orders'),
          where('createdAt', '>=', weekAgo)
        );
        const weekSnap = await getCountFromServer(weekQuery);
        const weeklyOrders = weekSnap.data().count;

        // طلبات هذا الشهر
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        const monthQuery = query(
          collection(db, 'orders'),
          where('createdAt', '>=', monthAgo)
        );
        const monthSnap = await getCountFromServer(monthQuery);
        const monthlyOrders = monthSnap.data().count;

        setStats({
          totalUsers,
          activeUsers,
          inactiveUsers: totalUsers - activeUsers,
          referrals,
          referrers,
          totalOrders,
          completedOrders,
          pendingOrders,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          todayOrders,
          weeklyOrders,
          monthlyOrders,
        });
      } catch (err) {
        console.error('خطأ في جلب الإحصائيات:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [period]);

  if (loading) {
    return <div className="admin-stats-loading">جاري تحميل الإحصائيات...</div>;
  }

  const cards = [
    { 
      title: 'إجمالي المستخدمين', 
      value: stats.totalUsers, 
      icon: <FiUsers />, 
      color: 'blue',
      subtitle: `${stats.activeUsers} نشط, ${stats.inactiveUsers} غير نشط`
    },
    { 
      title: 'المُحالون', 
      value: stats.referrals, 
      icon: <FiUserPlus />, 
      color: 'green',
      subtitle: `${stats.referrers} مُحيل`
    },
    { 
      title: 'إجمالي الطلبات', 
      value: stats.totalOrders, 
      icon: <FiShoppingBag />, 
      color: 'purple',
      subtitle: `${stats.completedOrders} مكتمل, ${stats.pendingOrders} معلق`
    },
    { 
      title: 'الإيرادات', 
      value: `$${stats.totalRevenue.toLocaleString()}`, 
      icon: <FiDollarSign />, 
      color: 'gold',
      subtitle: `من ${stats.completedOrders} طلب مكتمل`
    },
    { 
      title: 'طلبات اليوم', 
      value: stats.todayOrders, 
      icon: <FiClock />, 
      color: 'orange',
      subtitle: `آخر 24 ساعة`
    },
    { 
      title: 'طلبات هذا الأسبوع', 
      value: stats.weeklyOrders, 
      icon: <FiTrendingUp />, 
      color: 'teal',
      subtitle: `آخر 7 أيام`
    },
  ];

  return (
    <div className="admin-stats-cards">
      {cards.map((card, index) => (
        <div key={index} className={`stat-card stat-card--${card.color}`}>
          <div className="stat-card__icon">{card.icon}</div>
          <div className="stat-card__info">
            <div className="stat-card__title">{card.title}</div>
            <div className="stat-card__value">{card.value}</div>
            {card.subtitle && <div className="stat-card__subtitle">{card.subtitle}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}