


import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../../store/store';
import { FiBell } from 'react-icons/fi';
import './NotificationBell.css';

export default function NotificationBell() {
  const unreadCount = useAppStore((state) => state.unreadCount);
  const navigate = useNavigate();

  return (
    <button className="notification-bell" onClick={() => navigate('/notifications')}>
      <FiBell size={20} />
      {unreadCount > 0 && (
        <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
      )}
    </button>
  );
}