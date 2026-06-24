// src/pages/Admin/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../firebase';
import { 
  collection, getDocs, getCountFromServer, query, where, 
  orderBy, limit, onSnapshot, doc, getDoc 
} from 'firebase/firestore';
import {
  FiUsers, FiUserCheck, FiUserX, FiShoppingBag, FiDollarSign,
  FiTrendingUp, FiTrendingDown, FiActivity, FiClock,
  FiPackage, FiAward, FiBarChart2, FiRefreshCw
} from 'react-icons/fi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
  AreaChart, Area
} from 'recharts';
import './AdminDashboard.css';

// ===== ألوان المخططات =====
const COLORS = {
  primary: '#4f46e5',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  pink: '#ec4899',
  cyan: '#06b6d4',
};

const CHART_COLORS = [COLORS.primary, COLORS.success, COLORS.warning, COLORS.danger, COLORS.info, COLORS.pink];

export default function AdminDashboard() {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ===== الإحصائيات الأساسية =====
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    rejectedOrders: 0,
    totalRevenue: 0,
    todayOrders: 0,
    todayRevenue: 0,
    monthlyOrders: 0,
    monthlyRevenue: 0,
    // الإحالات
    totalReferrers: 0,
    totalReferred: 0,
    pendingReferrals: 0,
    claimedReferrals: 0,
  });

  // ===== بيانات الرسوم البيانية =====
  const [orderTrend, setOrderTrend] = useState([]);
  const [orderStatusData, setOrderStatusData] = useState([]);
  const [orderTypeData, setOrderTypeData] = useState([]);
  const [userGrowthData, setUserGrowthData] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topUsers, setTopUsers] = useState([]);

  // ===== جلب جميع البيانات =====
  const fetchAllData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchOrderTrend(),
        fetchOrderStatus(),
        fetchOrderTypes(),
        fetchUserGrowth(),
        fetchRecentOrders(),
        fetchTopUsers(),
      ]);
    } catch (err) {
      console.error('خطأ في جلب البيانات:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ===== 1. الإحصائيات الأساسية =====
  const fetchStats = async () => {
    try {
      // المستخدمين
      const usersSnap = await getCountFromServer(collection(db, 'users'));
      const totalUsers = usersSnap.data().count;

      // المستخدمين النشطين (لديهم طلبات في آخر 30 يوم)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const activeUsersQuery = query(
        collection(db, 'orders'),
        where('createdAt', '>=', thirtyDaysAgo)
      );
      const activeOrdersSnap = await getDocs(activeUsersQuery);
      const activeUserIds = new Set();
      activeOrdersSnap.forEach(doc => {
        const data = doc.data();
        if (data.userId) activeUserIds.add(data.userId);
      });
      const activeUsers = activeUserIds.size;

      // الطلبات
      const ordersSnap = await getCountFromServer(collection(db, 'orders'));
      const totalOrders = ordersSnap.data().count;

      // الطلبات حسب الحالة
      const pendingQuery = query(collection(db, 'orders'), where('status', 'in', ['pending_verification', 'awaiting_customer_resubmit', 'verified_pending_execution']));
      const pendingSnap = await getCountFromServer(pendingQuery);

      const completedQuery = query(collection(db, 'orders'), where('status', '==', 'completed'));
      const completedSnap = await getCountFromServer(completedQuery);

      const rejectedQuery = query(collection(db, 'orders'), where('status', '==', 'rejected'));
      const rejectedSnap = await getCountFromServer(rejectedQuery);

      // الإيرادات (من الطلبات المكتملة)
      let totalRevenue = 0;
      let todayRevenue = 0;
      let monthlyRevenue = 0;
      let todayOrders = 0;
      let monthlyOrders = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

      const allOrdersSnap = await getDocs(collection(db, 'orders'));
      allOrdersSnap.forEach(doc => {
        const order = doc.data();
        if (order.status === 'completed') {
          const amount = order.finalPriceUSD || order.finalPrice || order.amount || 0;
          totalRevenue += amount;
          
          const orderDate = order.createdAt?.toDate?.() || new Date(order.createdAt);
          if (orderDate >= today) {
            todayRevenue += amount;
            todayOrders++;
          }
          if (orderDate >= monthStart) {
            monthlyRevenue += amount;
            monthlyOrders++;
          }
        }
      });

      // الإحالات
      const referralQuery = query(collection(db, 'referral_rewards'));
      const referralSnap = await getDocs(referralQuery);
      const referrers = new Set();
      let pendingReferrals = 0;
      let claimedReferrals = 0;
      referralSnap.forEach(doc => {
        const data = doc.data();
        if (data.referrerId) referrers.add(data.referrerId);
        if (data.status === 'pending') pendingReferrals++;
        else if (data.status === 'claimed') claimedReferrals++;
      });

      setStats({
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        totalOrders,
        pendingOrders: pendingSnap.data().count,
        completedOrders: completedSnap.data().count,
        rejectedOrders: rejectedSnap.data().count,
        totalRevenue,
        todayOrders,
        todayRevenue,
        monthlyOrders,
        monthlyRevenue,
        totalReferrers: referrers.size,
        totalReferred: referralSnap.size,
        pendingReferrals,
        claimedReferrals,
      });
    } catch (err) {
      console.error('خطأ في جلب الإحصائيات:', err);
    }
  };

  // ===== 2. اتجاه الطلبات (آخر 7 أيام) =====
  const fetchOrderTrend = async () => {
    try {
      const days = 7;
      const result = [];
      const now = new Date();
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const q = query(
          collection(db, 'orders'),
          where('createdAt', '>=', date),
          where('createdAt', '<', nextDate)
        );
        const snap = await getDocs(q);
        
        const dayName = date.toLocaleDateString('ar-EG', { weekday: 'short' });
        const dayNum = date.getDate();
        
        let completed = 0, pending = 0, rejected = 0;
        snap.forEach(doc => {
          const status = doc.data().status;
          if (status === 'completed') completed++;
          else if (status === 'rejected') rejected++;
          else pending++;
        });
        
        result.push({
          day: `${dayName} ${dayNum}`,
          completed,
          pending,
          rejected,
          total: snap.size,
        });
      }
      setOrderTrend(result);
    } catch (err) {
      console.error('خطأ في جلب اتجاه الطلبات:', err);
    }
  };

  // ===== 3. توزيع الطلبات حسب الحالة =====
  const fetchOrderStatus = async () => {
    try {
      const statuses = ['pending_verification', 'awaiting_customer_resubmit', 'verified_pending_execution', 'completed', 'rejected'];
      const labels = {
        pending_verification: 'قيد التدقيق',
        awaiting_customer_resubmit: 'بانتظار التعديل',
        verified_pending_execution: 'تم التدقيق',
        completed: 'مكتمل',
        rejected: 'مرفوض',
      };
      const colors = {
        pending_verification: COLORS.warning,
        awaiting_customer_resubmit: COLORS.info,
        verified_pending_execution: COLORS.primary,
        completed: COLORS.success,
        rejected: COLORS.danger,
      };
      
      const result = [];
      for (const status of statuses) {
        const q = query(collection(db, 'orders'), where('status', '==', status));
        const snap = await getCountFromServer(q);
        result.push({
          name: labels[status] || status,
          value: snap.data().count,
          color: colors[status] || COLORS.primary,
        });
      }
      setOrderStatusData(result);
    } catch (err) {
      console.error('خطأ في جلب توزيع الحالات:', err);
    }
  };

  // ===== 4. توزيع الطلبات حسب النوع =====
  const fetchOrderTypes = async () => {
    try {
      const types = ['transfer', 'gaming', 'apps', 'crypto', 'exchange'];
      const labels = {
        transfer: 'تحويل شام كاش',
        gaming: 'شحن ألعاب',
        apps: 'شحن تطبيقات',
        crypto: 'عملات رقمية',
        exchange: 'صرافة',
      };
      const colors = {
        transfer: COLORS.info,
        gaming: COLORS.primary,
        apps: COLORS.success,
        crypto: COLORS.warning,
        exchange: COLORS.pink,
      };
      
      const result = [];
      for (const type of types) {
        const q = query(collection(db, 'orders'), where('type', '==', type));
        const snap = await getCountFromServer(q);
        if (snap.data().count > 0) {
          result.push({
            name: labels[type] || type,
            value: snap.data().count,
            color: colors[type] || COLORS.primary,
          });
        }
      }
      setOrderTypeData(result);
    } catch (err) {
      console.error('خطأ في جلب أنواع الطلبات:', err);
    }
  };

  // ===== 5. نمو المستخدمين (آخر 7 أيام) =====
  const fetchUserGrowth = async () => {
    try {
      const days = 7;
      const result = [];
      const now = new Date();
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const q = query(
          collection(db, 'users'),
          where('createdAt', '>=', date),
          where('createdAt', '<', nextDate)
        );
        const snap = await getDocs(q);
        
        const dayName = date.toLocaleDateString('ar-EG', { weekday: 'short' });
        result.push({
          day: `${dayName}`,
          newUsers: snap.size,
        });
      }
      setUserGrowthData(result);
    } catch (err) {
      console.error('خطأ في جلب نمو المستخدمين:', err);
    }
  };

  // ===== 6. آخر الطلبات =====
  const fetchRecentOrders = async () => {
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(10));
      const snap = await getDocs(q);
      const orders = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRecentOrders(orders);
    } catch (err) {
      console.error('خطأ في جلب آخر الطلبات:', err);
    }
  };

  // ===== 7. أهم المستخدمين (الأكثر طلبات) =====
  const fetchTopUsers = async () => {
    try {
      const ordersSnap = await getDocs(collection(db, 'orders'));
      const userOrders = {};
      ordersSnap.forEach(doc => {
        const data = doc.data();
        if (data.userId) {
          if (!userOrders[data.userId]) {
            userOrders[data.userId] = { count: 0, total: 0 };
          }
          userOrders[data.userId].count++;
          const amount = data.finalPriceUSD || data.finalPrice || data.amount || 0;
          userOrders[data.userId].total += amount;
        }
      });
      
      const sorted = Object.entries(userOrders)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5);
      
      const topUsersData = [];
      for (const [userId, data] of sorted) {
        const userSnap = await getDoc(doc(db, 'users', userId));
        const user = userSnap.exists() ? userSnap.data() : { name: 'مستخدم' };
        topUsersData.push({
          id: userId,
          name: user.name || 'مستخدم',
          orders: data.count,
          total: data.total,
        });
      }
      setTopUsers(topUsersData);
    } catch (err) {
      console.error('خطأ في جلب أهم المستخدمين:', err);
    }
  };

  // ===== تحميل البيانات عند فتح الصفحة =====
  useEffect(() => {
    fetchAllData();
  }, []);

  // ===== تنسيق العملة =====
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '0 $';
    return amount.toFixed(2) + ' $';
  };

  // ===== تنسيق التاريخ =====
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

  // ===== حالة عدم التصريح =====
  if (!userData || userData.role !== 'admin') {
    return <div className="admin-dashboard__unauthorized">غير مصرح لك بالوصول</div>;
  }

  if (loading) {
    return (
      <div className="admin-dashboard__loading">
        <div className="admin-dashboard__spinner"></div>
        <p>جاري تحميل لوحة التحكم...</p>
      </div>
    );
  }

  // ===== أسماء حالات الطلبات =====
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
    <div className="admin-dashboard" dir="rtl">
      {/* ===== الهيدر ===== */}
      <div className="admin-dashboard__header">
        <div>
          <h1 className="admin-dashboard__title">📊 لوحة تحكم المدير</h1>
          <p className="admin-dashboard__subtitle">إحصائيات شاملة لأداء الموقع</p>
        </div>
        <button 
          className="admin-dashboard__refresh-btn" 
          onClick={fetchAllData} 
          disabled={refreshing}
        >
          <FiRefreshCw className={refreshing ? 'admin-dashboard__refresh-spin' : ''} />
          {refreshing ? 'جاري التحديث...' : 'تحديث'}
        </button>
      </div>

      {/* ===== بطاقات الإحصائيات الأساسية ===== */}
      <div className="admin-dashboard__stats-grid">
        <div className="admin-dashboard__stat-card admin-dashboard__stat-card--primary">
          <div className="admin-dashboard__stat-icon"><FiUsers /></div>
          <div className="admin-dashboard__stat-content">
            <span className="admin-dashboard__stat-label">إجمالي المستخدمين</span>
            <span className="admin-dashboard__stat-value">{stats.totalUsers}</span>
          </div>
        </div>

        <div className="admin-dashboard__stat-card admin-dashboard__stat-card--success">
          <div className="admin-dashboard__stat-icon"><FiUserCheck /></div>
          <div className="admin-dashboard__stat-content">
            <span className="admin-dashboard__stat-label">مستخدمين نشطين</span>
            <span className="admin-dashboard__stat-value">{stats.activeUsers}</span>
            <span className="admin-dashboard__stat-sub">({Math.round((stats.activeUsers / stats.totalUsers) * 100)}%)</span>
          </div>
        </div>

        <div className="admin-dashboard__stat-card admin-dashboard__stat-card--danger">
          <div className="admin-dashboard__stat-icon"><FiUserX /></div>
          <div className="admin-dashboard__stat-content">
            <span className="admin-dashboard__stat-label">مستخدمين غير نشطين</span>
            <span className="admin-dashboard__stat-value">{stats.inactiveUsers}</span>
          </div>
        </div>

        <div className="admin-dashboard__stat-card admin-dashboard__stat-card--info">
          <div className="admin-dashboard__stat-icon"><FiShoppingBag /></div>
          <div className="admin-dashboard__stat-content">
            <span className="admin-dashboard__stat-label">إجمالي الطلبات</span>
            <span className="admin-dashboard__stat-value">{stats.totalOrders}</span>
          </div>
        </div>

        <div className="admin-dashboard__stat-card admin-dashboard__stat-card--warning">
          <div className="admin-dashboard__stat-icon"><FiClock /></div>
          <div className="admin-dashboard__stat-content">
            <span className="admin-dashboard__stat-label">طلبات معلقة</span>
            <span className="admin-dashboard__stat-value">{stats.pendingOrders}</span>
          </div>
        </div>

        <div className="admin-dashboard__stat-card admin-dashboard__stat-card--success">
          <div className="admin-dashboard__stat-icon"><FiTrendingUp /></div>
          <div className="admin-dashboard__stat-content">
            <span className="admin-dashboard__stat-label">الإيرادات الكلية</span>
            <span className="admin-dashboard__stat-value">{formatCurrency(stats.totalRevenue)}</span>
          </div>
        </div>

        <div className="admin-dashboard__stat-card admin-dashboard__stat-card--purple">
          <div className="admin-dashboard__stat-icon"><FiAward /></div>
          <div className="admin-dashboard__stat-content">
            <span className="admin-dashboard__stat-label">محيلين / محالين</span>
            <span className="admin-dashboard__stat-value">{stats.totalReferrers} / {stats.totalReferred}</span>
          </div>
        </div>

        <div className="admin-dashboard__stat-card admin-dashboard__stat-card--pink">
          <div className="admin-dashboard__stat-icon"><FiActivity /></div>
          <div className="admin-dashboard__stat-content">
            <span className="admin-dashboard__stat-label">طلبات اليوم</span>
            <span className="admin-dashboard__stat-value">{stats.todayOrders}</span>
            <span className="admin-dashboard__stat-sub">{formatCurrency(stats.todayRevenue)}</span>
          </div>
        </div>
      </div>

      {/* ===== الرسوم البيانية ===== */}
      <div className="admin-dashboard__charts-row">
        {/* اتجاه الطلبات */}
        <div className="admin-dashboard__chart-card admin-dashboard__chart-card--full">
          <div className="admin-dashboard__chart-header">
            <h3>📈 اتجاه الطلبات (آخر 7 أيام)</h3>
          </div>
          <div className="admin-dashboard__chart-body">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={orderTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="day" stroke="var(--color-text-secondary)" />
                <YAxis stroke="var(--color-text-secondary)" />
                <Tooltip 
                  contentStyle={{ 
                    background: 'var(--color-bg-secondary)', 
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar dataKey="completed" name="مكتمل" fill={COLORS.success} />
                <Bar dataKey="pending" name="معلق" fill={COLORS.warning} />
                <Bar dataKey="rejected" name="مرفوض" fill={COLORS.danger} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="admin-dashboard__charts-row">
        {/* توزيع الطلبات حسب الحالة */}
        <div className="admin-dashboard__chart-card">
          <div className="admin-dashboard__chart-header">
            <h3>🧩 توزيع الطلبات حسب الحالة</h3>
          </div>
          <div className="admin-dashboard__chart-body admin-dashboard__chart-body--pie">
            {orderStatusData.filter(d => d.value > 0).length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={orderStatusData.filter(d => d.value > 0)}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {orderStatusData.filter(d => d.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="admin-dashboard__chart-empty">لا توجد بيانات كافية</p>
            )}
          </div>
        </div>

        {/* توزيع الطلبات حسب النوع */}
        <div className="admin-dashboard__chart-card">
          <div className="admin-dashboard__chart-header">
            <h3>📦 توزيع الطلبات حسب النوع</h3>
          </div>
          <div className="admin-dashboard__chart-body admin-dashboard__chart-body--pie">
            {orderTypeData.filter(d => d.value > 0).length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={orderTypeData.filter(d => d.value > 0)}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {orderTypeData.filter(d => d.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="admin-dashboard__chart-empty">لا توجد بيانات كافية</p>
            )}
          </div>
        </div>
      </div>

      <div className="admin-dashboard__charts-row">
        {/* نمو المستخدمين */}
        <div className="admin-dashboard__chart-card admin-dashboard__chart-card--full">
          <div className="admin-dashboard__chart-header">
            <h3>👥 نمو المستخدمين (آخر 7 أيام)</h3>
          </div>
          <div className="admin-dashboard__chart-body">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="day" stroke="var(--color-text-secondary)" />
                <YAxis stroke="var(--color-text-secondary)" />
                <Tooltip 
                  contentStyle={{ 
                    background: 'var(--color-bg-secondary)', 
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="newUsers" 
                  name="مستخدمين جدد" 
                  fill={COLORS.primary} 
                  stroke={COLORS.primary} 
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ===== أهم المستخدمين ===== */}
      <div className="admin-dashboard__charts-row">
        <div className="admin-dashboard__chart-card admin-dashboard__chart-card--full">
          <div className="admin-dashboard__chart-header">
            <h3>🏆 أهم المستخدمين (الأكثر طلبات)</h3>
          </div>
          <div className="admin-dashboard__top-users">
            {topUsers.length === 0 ? (
              <p className="admin-dashboard__chart-empty">لا توجد بيانات كافية</p>
            ) : (
              <div className="admin-dashboard__top-users-list">
                {topUsers.map((user, index) => (
                  <div key={user.id} className="admin-dashboard__top-user">
                    <span className="admin-dashboard__top-user-rank">#{index + 1}</span>
                    <span className="admin-dashboard__top-user-name">{user.name}</span>
                    <div className="admin-dashboard__top-user-bar">
                      <div 
                        className="admin-dashboard__top-user-fill" 
                        style={{ 
                          width: `${(user.orders / topUsers[0].orders) * 100}%`,
                          background: CHART_COLORS[index % CHART_COLORS.length]
                        }}
                      />
                    </div>
                    <span className="admin-dashboard__top-user-count">{user.orders} طلب</span>
                    <span className="admin-dashboard__top-user-total">{formatCurrency(user.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== آخر الطلبات ===== */}
      <div className="admin-dashboard__charts-row">
        <div className="admin-dashboard__chart-card admin-dashboard__chart-card--full">
          <div className="admin-dashboard__chart-header">
            <h3>🕐 آخر الطلبات</h3>
          </div>
          <div className="admin-dashboard__recent-orders">
            {recentOrders.length === 0 ? (
              <p className="admin-dashboard__chart-empty">لا توجد طلبات حديثة</p>
            ) : (
              <div className="admin-dashboard__recent-orders-list">
                <table className="admin-dashboard__recent-orders-table">
                  <thead>
                    <tr>
                      <th>رقم الطلب</th>
                      <th>النوع</th>
                      <th>العميل</th>
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
                        <td>{order.customerName || '—'}</td>
                        <td>{formatCurrency(order.finalPriceUSD || order.finalPrice || order.amount || 0)}</td>
                        <td>
                          <span className={`admin-dashboard__status-badge admin-dashboard__status-badge--${order.status}`}>
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
        </div>
      </div>
    </div>
  );
}