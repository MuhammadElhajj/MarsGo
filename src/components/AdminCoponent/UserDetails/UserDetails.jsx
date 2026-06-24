// src/pages/Admin/UserDetails/UserDetails.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuth } from '../../../context/AuthContext';
import Avatar from '../../../components/GeneralComponents/Avatar/Avatar';
import Button from '../../../components/GeneralComponents/Button/Button';
import GoBackButton from '../../../components/GeneralComponents/GoBackButton/GoBackButton';
import Loading from '../../../components/GeneralComponents/Loading/Loading';
import {
  FiUser, FiMail, FiCalendar, FiAward, FiStar,
  FiShoppingBag, FiDollarSign, FiUsers, FiHeart,
  FiZap, FiTrendingUp, FiClock, FiPackage, FiCheckCircle,
  FiXCircle, FiAlertCircle, FiRefreshCw
} from 'react-icons/fi';
import './UserDetails.css';

export default function UserDetails() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { userData } = useAuth();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    completedOrders: 0,
    rejectedOrders: 0,
    pendingOrders: 0,
    totalSpent: 0,
    totalEarned: 0,
    referralCount: 0,
    friendsCount: 0,
    popularity: 0,
    power: 0,
    level: 1,
    xp: 0,
    title: null,
    lastActive: null,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [referrals, setReferrals] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        // جلب بيانات المستخدم
        const userSnap = await getDoc(doc(db, 'users', userId));
        if (!userSnap.exists()) {
          alert('المستخدم غير موجود');
          navigate(`/admin/user/${userId}`);
          return;
        }
        const userData = { id: userSnap.id, ...userSnap.data() };
        setUser(userData);

        // جلب الطلبات
        const ordersQuery = query(collection(db, 'orders'), where('userId', '==', userId));
        const ordersSnap = await getDocs(ordersQuery);
        const orders = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        let completed = 0, rejected = 0, pending = 0, totalSpent = 0;
        orders.forEach(order => {
          if (order.status === 'completed') {
            completed++;
            totalSpent += order.finalPriceUSD || order.finalPrice || order.amount || 0;
          } else if (order.status === 'rejected') {
            rejected++;
          } else {
            pending++;
          }
        });

        // جلب الإحالات (كمرجع)
        const referralQuery = query(collection(db, 'referral_rewards'), where('referrerId', '==', userId));
        const referralSnap = await getDocs(referralQuery);
        const referralCount = referralSnap.size;

        // جلب آخر 10 طلبات
        const recentOrdersQuery = query(
          collection(db, 'orders'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
        try {
          const recentSnap = await getDocs(recentOrdersQuery);
          setRecentOrders(recentSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) {
          // فشل بسبب الفهرس، نجلب بدون orderBy
          const fallbackSnap = await getDocs(query(collection(db, 'orders'), where('userId', '==', userId), limit(10)));
          let ordersList = fallbackSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          ordersList.sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0));
          setRecentOrders(ordersList.slice(0, 10));
        }

        // جلب قائمة الإحالات (المحالين)
        const referralsList = [];
        for (const docSnap of referralSnap.docs) {
          const refData = docSnap.data();
          const referredId = refData.referredId;
          const referredSnap = await getDoc(doc(db, 'users', referredId));
          if (referredSnap.exists()) {
            referralsList.push({
              id: referredId,
              name: referredSnap.data().name || 'مستخدم',
              status: refData.status || 'pending',
              rewardAmount: refData.rewardAmount || 20,
              createdAt: refData.createdAt,
            });
          }
        }
        setReferrals(referralsList);

        setStats({
          totalOrders: orders.length,
          completedOrders: completed,
          rejectedOrders: rejected,
          pendingOrders: pending,
          totalSpent: totalSpent,
          totalEarned: 0, // يمكن حسابه من مكافآت الإحالة أو العمولات لاحقاً
          referralCount: referralCount,
          friendsCount: userData.friends?.length || 0,
          popularity: userData.popularity || 0,
          power: userData.power || 0,
          level: userData.level || 1,
          xp: userData.xp || 0,
          title: userData.title || null,
          lastActive: userData.lastActive || null,
        });
      } catch (err) {
        console.error(err);
        alert('حدث خطأ في تحميل البيانات');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId, navigate]);

  if (loading) return <Loading text="جاري تحميل بيانات المستخدم..." />;
  if (!user) return <div>المستخدم غير موجود</div>;

  const formatDate = (timestamp) => {
    if (!timestamp) return '—';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '0 $';
    return amount.toFixed(2) + ' $';
  };

  const orderStatusLabels = {
    pending_verification: 'قيد التدقيق',
    awaiting_customer_resubmit: 'بانتظار التعديل',
    verified_pending_execution: 'تم التدقيق',
    completed: 'مكتمل',
    rejected: 'مرفوض',
  };

  const orderTypeLabels = {
    transfer: 'تحويل شام كاش',
    gaming: 'شحن ألعاب',
    apps: 'شحن تطبيقات',
    crypto: 'عملات رقمية',
    exchange: 'صرافة',
  };

  return (
    <div className="user-details" dir="rtl">
      <div className="user-details__header">
        <GoBackButton text="رجوع إلى قائمة المستخدمين" onClick={() => navigate('/admin/users')} />
        <h1 className="user-details__title">📋 تفاصيل المستخدم</h1>
      </div>

      {/* البطاقة الشخصية */}
      <div className="user-details__profile-card">
        <div className="user-details__profile-avatar">
          <Avatar src={user.avatar} name={user.name} email={user.email} size="xl" />
        </div>
        <div className="user-details__profile-info">
          <h2 className="user-details__profile-name">{user.name}</h2>
          <div className="user-details__profile-meta">
            <span className="user-details__profile-email"><FiMail /> {user.email}</span>
            <span className="user-details__profile-uid"><FiUser /> {user.uniqueId || '—'}</span>
            <span className="user-details__profile-role">
              {user.role === 'admin' && '👑 مدير'}
              {user.role === 'verifier' && '🔍 مدقق'}
              {user.role === 'finance_verifier' && '💰 مدقق مالي'}
              {user.role === 'customer' && '👤 زبون'}
            </span>
            <span className="user-details__profile-joined"><FiCalendar /> انضم: {formatDate(user.createdAt)}</span>
          </div>
          <div className="user-details__profile-stats">
            <span><FiUsers /> الأصدقاء: {stats.friendsCount}</span>
            <span><FiHeart /> الشعبية: {stats.popularity}</span>
            <span><FiZap /> القوة: {stats.power}</span>
            <span><FiAward /> المستوى: {stats.level}</span>
            <span><FiStar /> XP: {stats.xp}</span>
            {stats.title && <span><FiStar /> اللقب: {stats.title}</span>}
          </div>
        </div>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="user-details__stats-grid">
        <div className="user-details__stat-card user-details__stat-card--primary">
          <div className="user-details__stat-icon"><FiShoppingBag /></div>
          <div className="user-details__stat-content">
            <span className="user-details__stat-label">إجمالي الطلبات</span>
            <span className="user-details__stat-value">{stats.totalOrders}</span>
          </div>
        </div>
        <div className="user-details__stat-card user-details__stat-card--success">
          <div className="user-details__stat-icon"><FiCheckCircle /></div>
          <div className="user-details__stat-content">
            <span className="user-details__stat-label">مكتملة</span>
            <span className="user-details__stat-value">{stats.completedOrders}</span>
          </div>
        </div>
        <div className="user-details__stat-card user-details__stat-card--warning">
          <div className="user-details__stat-icon"><FiAlertCircle /></div>
          <div className="user-details__stat-content">
            <span className="user-details__stat-label">معلقة</span>
            <span className="user-details__stat-value">{stats.pendingOrders}</span>
          </div>
        </div>
        <div className="user-details__stat-card user-details__stat-card--danger">
          <div className="user-details__stat-icon"><FiXCircle /></div>
          <div className="user-details__stat-content">
            <span className="user-details__stat-label">مرفوضة</span>
            <span className="user-details__stat-value">{stats.rejectedOrders}</span>
          </div>
        </div>
        <div className="user-details__stat-card user-details__stat-card--purple">
          <div className="user-details__stat-icon"><FiDollarSign /></div>
          <div className="user-details__stat-content">
            <span className="user-details__stat-label">إجمالي الإنفاق</span>
            <span className="user-details__stat-value">{formatCurrency(stats.totalSpent)}</span>
          </div>
        </div>
        <div className="user-details__stat-card user-details__stat-card--info">
          <div className="user-details__stat-icon"><FiUsers /></div>
          <div className="user-details__stat-content">
            <span className="user-details__stat-label">عدد الإحالات</span>
            <span className="user-details__stat-value">{stats.referralCount}</span>
          </div>
        </div>
        <div className="user-details__stat-card user-details__stat-card--pink">
          <div className="user-details__stat-icon"><FiClock /></div>
          <div className="user-details__stat-content">
            <span className="user-details__stat-label">آخر نشاط</span>
            <span className="user-details__stat-value">{stats.lastActive ? formatDate(stats.lastActive) : '—'}</span>
          </div>
        </div>
        <div className="user-details__stat-card user-details__stat-card--green">
          <div className="user-details__stat-icon"><FiTrendingUp /></div>
          <div className="user-details__stat-content">
            <span className="user-details__stat-label">إجمالي الأرباح</span>
            <span className="user-details__stat-value">{formatCurrency(stats.totalEarned)}</span>
          </div>
        </div>
      </div>

      {/* آخر الطلبات */}
      <div className="user-details__section">
        <h3 className="user-details__section-title">🕐 آخر الطلبات</h3>
        {recentOrders.length === 0 ? (
          <p className="user-details__empty">لا توجد طلبات</p>
        ) : (
          <div className="user-details__table-wrapper">
            <table className="user-details__table">
              <thead>
                <tr>
                  <th>رقم الطلب</th>
                  <th>النوع</th>
                  <th>المبلغ</th>
                  <th>الحالة</th>
                  <th>التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order.id}>
                    <td>#{order.id.slice(-6)}</td>
                    <td>{orderTypeLabels[order.type] || order.type}</td>
                    <td>{formatCurrency(order.finalPriceUSD || order.finalPrice || order.amount || 0)}</td>
                    <td>
                      <span className={`user-details__status-badge user-details__status-badge--${order.status}`}>
                        {orderStatusLabels[order.status] || order.status}
                      </span>
                    </td>
                    <td>{formatDate(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* قائمة الإحالات */}
      <div className="user-details__section">
        <h3 className="user-details__section-title">🎁 الإحالات</h3>
        {referrals.length === 0 ? (
          <p className="user-details__empty">لا توجد إحالات</p>
        ) : (
          <div className="user-details__table-wrapper">
            <table className="user-details__table">
              <thead>
                <tr>
                  <th>المستخدم المحال</th>
                  <th>المكافأة</th>
                  <th>الحالة</th>
                  <th>التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map(ref => (
                  <tr key={ref.id}>
                    <td>{ref.name}</td>
                    <td>{ref.rewardAmount} MGC</td>
                    <td>
                      <span className={`user-details__status-badge user-details__status-badge--${ref.status}`}>
                        {ref.status === 'claimed' ? 'مودعة' : 'معلقة'}
                      </span>
                    </td>
                    <td>{formatDate(ref.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}