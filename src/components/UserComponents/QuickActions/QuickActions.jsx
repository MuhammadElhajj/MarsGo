// src/components/UserComponents/QuickActions/QuickActions.jsx
import { useNavigate } from 'react-router-dom';
import { 
  FiDollarSign, FiBox, FiZap, FiShare2, FiTrendingDown, FiUsers,
  FiGift, FiCreditCard, FiTag, FiShoppingBag, FiTool
} from 'react-icons/fi';
import './QuickActions.css';

const actions = [
  // ===== العناصر النشطة =====
  { id: 'topup', label: 'شحن', icon: <FiZap />, path: '/topup', className: 'quick-actions__item--topup' },
  { id: 'coins', label: 'عملات MGC', icon: <FiDollarSign />, path: '/buy-mgc', className: 'quick-actions__item--coins' },
  { id: 'referral', label: 'إحالة', icon: <FiShare2 />, path: '/referral', className: 'quick-actions__item--referral' },
  { id: 'sell', label: 'بيع MGC', icon: <FiTrendingDown />, path: '/sell-mgc', className: 'quick-actions__item--sell' },
  { id: 'mianfriendspage', label: 'الأصدقاء', icon: <FiUsers />, path: '/mianfriendspage', className: 'quick-actions__item--friends' },

  // ===== العناصر غير النشطة (معطلة) =====
  { id: 'gift', label: 'هدايا', icon: <FiGift />, path: null, className: 'quick-actions__item--disabled' },
  { id: 'cards', label: 'بطاقات', icon: <FiCreditCard />, path: null, className: 'quick-actions__item--disabled' },
  { id: 'offers', label: 'عروض', icon: <FiTag />, path: null, className: 'quick-actions__item--disabled' },
  { id: 'store', label: 'متجر', icon: <FiShoppingBag />, path: null, className: 'quick-actions__item--disabled' },
  { id: 'services', label: 'خدمات', icon: <FiTool />, path: null, className: 'quick-actions__item--disabled' },
];

export default function QuickActions() {
  const navigate = useNavigate();

  const handleClick = (path) => {
    if (path) {
      navigate(path);
    }
  };

  return (
    <div className="quick-actions">
      {actions.map((action) => (
        <div
          key={action.id}
          className={`quick-actions__item ${action.className}`}
          onClick={() => handleClick(action.path)}
          style={{ cursor: action.path ? 'pointer' : 'default' }}
        >
          <div className="quick-actions__icon">{action.icon}</div>
          <span className="quick-actions__label">{action.label}</span>
        </div>
      ))}
    </div>
  );
}