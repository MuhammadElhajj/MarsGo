// src/pages/Admin/AdminDashboard/AdminDashboard.jsx
import { useAuth } from '../../../context/AuthContext';
import { FiRefreshCw } from 'react-icons/fi';
import './AdminDashboard.css';
import { useAdminStats } from './hooks/useAdminStats';

// استيراد المكونات الفرعية
import StatsCards from './components/StatsCards';
import OrderTrendChart from './components/OrderTrendChart';
import OrderStatusPie from './components/OrderStatusPie';
import OrderTypePie from './components/OrderTypePie';
import UserGrowthChart from './components/UserGrowthChart';
import TopUsersList from './components/TopUsersList';
import RecentOrdersTable from './components/RecentOrdersTable';

export default function AdminDashboard() {
  const { userData } = useAuth();
  const {
    stats,
    orderTrend,
    orderStatusData,
    orderTypeData,
    userGrowthData,
    recentOrders,
    topUsers,
    loading,
    refreshing,
    fetchAllData,
  } = useAdminStats();

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

      {/* ===== بطاقات الإحصائيات ===== */}
      <div className="admin-dashboard__stats-grid">
        <StatsCards stats={stats} />
      </div>

      {/* ===== الرسوم البيانية ===== */}
      <div className="admin-dashboard__charts-row">
        <OrderTrendChart data={orderTrend} />
      </div>

      <div className="admin-dashboard__charts-row">
        <OrderStatusPie data={orderStatusData} />
        <OrderTypePie data={orderTypeData} />
      </div>

      <div className="admin-dashboard__charts-row">
        <UserGrowthChart data={userGrowthData} />
      </div>

      {/* ===== أهم المستخدمين ===== */}
      <div className="admin-dashboard__charts-row">
        <TopUsersList topUsers={topUsers} />
      </div>

      {/* ===== آخر الطلبات ===== */}
      <div className="admin-dashboard__charts-row">
        <RecentOrdersTable orders={recentOrders} />
      </div>
    </div>
  );
}