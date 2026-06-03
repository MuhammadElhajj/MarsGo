import { useNotifications } from '../../../context/NotificationContext';
import GoBackButton from '../../../components/GeneralComponents/GoBackButton/GoBackButton';
import Button from '../../../components/GeneralComponents/Button/Button';
import Loading from '../../../components/GeneralComponents/Loading/Loading';
import { Link } from 'react-router-dom';
import './NotificationsPage.css';

export default function NotificationsPage() {
  const { notifications, loading, markAllAsRead, markAsRead } = useNotifications();

  const handleMarkAll = async () => {
    await markAllAsRead();
  };

  if (loading) return <Loading text="جاري تحميل الإشعارات..." />;

  return (
    <div className="notifications-page" dir="rtl">
      <div className="notifications-page__header">
        <GoBackButton text="رجوع" />
        <h2>الإشعارات</h2>
        <Button onClick={handleMarkAll} variant="primary" size="sm">
          ✅ تحديد كمقروء
        </Button>
      </div>

      {notifications.length === 0 ? (
        <div className="notifications-page__empty">
          <span>🔔</span>
          <p>لا توجد إشعارات حالياً</p>
        </div>
      ) : (
        <div className="notifications-page__list">
          {notifications.map(notif => (
            <div
              key={notif.id}
              className={`notification-item ${!notif.read ? 'unread' : ''}`}
              onClick={async () => {
                if (!notif.read) await markAsRead(notif.id);
                if (notif.link) window.location.href = notif.link;
              }}
            >
              <div className="notification-item__icon">
                {/* {notif.type === 'order_created' && '📦'} */}
                {/* {notif.type === 'order_verified' && '✅'}
                {notif.type === 'order_completed' && '🎉'}
                {notif.type === 'order_rejected' && '❌'}
                {notif.type === 'order_resubmit' && '✏️'} */}
              </div>
              <div className="notification-item__content">
                <h4>{notif.title}</h4>
                <p>{notif.message}</p>
                <small>{notif.createdAt?.toDate().toLocaleString('ar-SY') || ''}</small>
              </div>
              {!notif.read && <div className="notification-item__unread-dot"></div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}