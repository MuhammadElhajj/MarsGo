// src/components/AdminCoponent/AdminDashboard/AdminQuickActions.jsx
import { useNavigate } from 'react-router-dom';
import { FiUsers, FiShoppingBag, FiDollarSign, FiSettings, FiTrendingUp, FiBell } from 'react-icons/fi';
import './AdminQuickActions.css';

export default function AdminQuickActions() {
  const navigate = useNavigate();

  const actions = [
    { label: 'إدارة المستخدمين', icon: <FiUsers />, path: '/admin/users', color: 'blue' },
    { label: 'الطلبات', icon: <FiShoppingBag />, path: '/admin/orders', color: 'green' },
    { label: 'الإيرادات', icon: <FiDollarSign />, path: '/admin/orders?filter=completed', color: 'gold' },
    { label: 'الإعدادات', icon: <FiSettings />, path: '/admin/store-settings', color: 'purple' },
    { label: 'الإحصائيات', icon: <FiTrendingUp />, path: '/admin', color: 'teal' },
    { label: 'الإشعارات', icon: <FiBell />, path: '/admin/notifications', color: 'red' },
  ];

  return (
    <div className="admin-quick-actions">
      <h3>⚡ إجراءات سريعة</h3>
      <div className="quick-actions-grid">
        {actions.map((action, index) => (
          <button 
            key={index}
            className={`quick-action-btn quick-action-btn--${action.color}`}
            onClick={() => navigate(action.path)}
          >
            <span className="quick-action-btn__icon">{action.icon}</span>
            <span className="quick-action-btn__label">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}