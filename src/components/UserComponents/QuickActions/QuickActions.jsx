// src/components/UserComponents/QuickActions/QuickActions.jsx
import { useNavigate } from 'react-router-dom';
import { 
  FiDollarSign, FiBox, FiZap, FiShare2, FiTrendingDown, FiUsers,
  FiTag, FiShoppingBag, FiTool, FiTarget, FiAward, FiStar,
  FiFlag,   // للكلانات
  FiShield  // للمشرف
} from 'react-icons/fi';
import './QuickActions.css';

const actions = [
  // ===== العناصر النشطة =====
  { id: 'topup', label: 'شحن', icon: <FiZap />, path: '/topup', className: 'quick-actions__item--topup' },
  { id: 'coins', label: 'عملات MGC', icon: <FiDollarSign />, path: '/buy-mgc', className: 'quick-actions__item--coins' },
  { id: 'referral', label: 'إحالة', icon: <FiShare2 />, path: '/referral', className: 'quick-actions__item--referral' },
  { id: 'sell', label: 'بيع MGC', icon: <FiTrendingDown />, path: '/sell-mgc', className: 'quick-actions__item--sell' },
  { id: 'mianfriendspage', label: 'الأصدقاء', icon: <FiUsers />, path: '/mianfriendspage', className: 'quick-actions__item--friends' },
  { id: 'missions', label: 'مهام', icon: <FiTarget />, path: '/missions', className: 'quick-actions__item--missions' },
  { id: 'memberships', label: 'عضويات', icon: <FiAward />, path: '/memberships', className: 'quick-actions__item--memberships' },
  { id: 'reviews', label: 'تقييمات', icon: <FiStar />, path: '/reviews', className: 'quick-actions__item--reviews' },

  // ===== الأقسام الجديدة =====
  { id: 'clans', label: 'كلانات', icon: <FiFlag />, path: '/clans', className: 'quick-actions__item--clans' },
  { id: 'supervisor', label: 'ترشح مشرف', icon: <FiShield />, path: '/supervisor-candidacy', className: 'quick-actions__item--supervisor' },
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
          role="button"
          tabIndex={action.path ? 0 : -1}
          aria-label={action.label}
        >
          <div className="quick-actions__icon">{action.icon}</div>
          <span className="quick-actions__label">{action.label}</span>
        </div>
      ))}
    </div>
  );
}