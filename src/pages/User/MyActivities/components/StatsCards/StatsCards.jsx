// src/pages/User/MyActivitiesPage/components/StatsCards/StatsCards.jsx
import { FiDollarSign, FiShoppingBag, FiCheckCircle } from 'react-icons/fi';

export default function StatsCards({ stats }) {
  return (
    <>
      <div className="stat-card">
        <FiDollarSign className="stat-icon" />
        <span className="stat-number">{stats.totalDeposits.toFixed(2)} $</span>
        <span className="stat-label">إجمالي الإيداعات</span>
      </div>
      <div className="stat-card">
        <FiShoppingBag className="stat-icon" />
        <span className="stat-number">{stats.orders}</span>
        <span className="stat-label">إجمالي الطلبات</span>
      </div>
      <div className="stat-card">
        <FiCheckCircle className="stat-icon" />
        <span className="stat-number">{stats.approvedDeposits || 0}</span>
        <span className="stat-label">إيداعات معتمدة</span>
      </div>
    </>
  );
}