// src/components/UserComponents/QuickActions/QuickActions.jsx
import { useNavigate } from 'react-router-dom';
import { FiDollarSign, FiGift, FiKey, FiBox, FiZap } from 'react-icons/fi';
import './QuickActions.css';

const actions = [
  { id: 'topup', label: 'شحن', icon: <FiZap />, path: '/topup' },
  { id: 'coins', label: 'عملات MGC', icon: <FiDollarSign />, path: '/buy-mgc' },
  { id: 'gift', label: 'بطاقات هدايا', icon: <FiGift />, path: '/buy-mgc' },
  { id: 'keys', label: 'مفاتيح', icon: <FiKey />, path: '/buy-mgc' },
  { id: 'items', label: 'عناصر', icon: <FiBox />, path: '/buy-mgc' },
];

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="quick-actions">
      {actions.map((action) => (
        <div
          key={action.id}
          className="quick-actions__item"
          onClick={() => navigate(action.path)}
        >
          <div className="quick-actions__icon">{action.icon}</div>
          <span className="quick-actions__label">{action.label}</span>
        </div>
      ))}
    </div>
  );
}