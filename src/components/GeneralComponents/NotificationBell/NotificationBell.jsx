import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../../context/NotificationContext';
import { FiBell } from 'react-icons/fi';
import './NotificationBell.css';

export default function NotificationBell() {
  const { unreadCount } = useNotifications();
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