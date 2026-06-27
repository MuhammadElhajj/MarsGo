// src/pages/Admin/AdminDashboard/components/StatsCards/StatsCards.jsx
import {
  FiUsers,
  FiUserCheck,
  FiUserX,
  FiShoppingBag,
  FiDollarSign,
  FiTrendingUp,
  FiClock,
  FiActivity,
  FiAward,
} from 'react-icons/fi';
import { formatCurrency } from '../../utils/formatters';

export default function StatsCards({ stats }) {
  return (
    <>
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
          <span className="admin-dashboard__stat-sub">
            ({Math.round((stats.activeUsers / stats.totalUsers) * 100)}%)
          </span>
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
    </>
  );
}