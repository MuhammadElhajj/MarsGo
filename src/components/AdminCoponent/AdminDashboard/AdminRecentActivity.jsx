// src/components/AdminCoponent/AdminDashboard/AdminRecentActivity.jsx
import { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { FiUser, FiShoppingBag, FiDollarSign, FiClock } from 'react-icons/fi';
import './AdminRecentActivity.css';

export default function AdminRecentActivity({ period }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      try {
        // جلب آخر 10 طلبات
        const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(10));
        const snap = await getDocs(q);
        const orders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const activityItems = orders.map(order => {
          const statusMap = {
            'completed': { label: 'مكتمل', icon: '✅' },
            'pending_verification': { label: 'قيد التدقيق', icon: '⏳' },
            'awaiting_customer_resubmit': { label: 'بانتظار تعديل', icon: '✏️' },
            'verified_pending_execution': { label: 'تم التدقيق', icon: '🔍' },
            'rejected': { label: 'مرفوض', icon: '❌' }
          };
          const status = statusMap[order.status] || { label: order.status, icon: '📦' };
          const typeMap = {
            'gaming': 'شحن ألعاب',
            'apps': 'شحن تطبيقات',
            'transfer': 'تحويل',
            'crypto': 'عملات رقمية',
            'exchange': 'صرافة'
          };
          const type = typeMap[order.type] || order.type;

          return {
            id: order.id,
            type: 'order',
            title: `طلب #${order.id.slice(-6)}`,
            description: `${type} - ${status.icon} ${status.label}`,
            user: order.customerName || 'مستخدم',
            amount: order.finalPriceUSD || order.finalPrice || order.amount || 0,
            time: order.createdAt?.toDate?.() || new Date(order.createdAt),
            status: order.status,
          };
        });

        setActivities(activityItems);
      } catch (err) {
        console.error('خطأ في جلب النشاطات:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [period]);

  if (loading) {
    return <div className="admin-recent-loading">جاري تحميل النشاطات...</div>;
  }

  return (
    <div className="admin-recent-activity">
      <h3>🕐 آخر النشاطات</h3>
      <div className="activity-list">
        {activities.length === 0 ? (
          <p className="activity-empty">لا توجد نشاطات حديثة</p>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="activity-item">
              <div className="activity-item__icon">
                {activity.type === 'order' ? <FiShoppingBag /> : <FiUser />}
              </div>
              <div className="activity-item__content">
                <div className="activity-item__header">
                  <span className="activity-item__title">{activity.title}</span>
                  <span className={`activity-item__status status-${activity.status}`}>
                    {activity.status === 'completed' ? '✅' : 
                     activity.status === 'rejected' ? '❌' : '⏳'}
                  </span>
                </div>
                <div className="activity-item__details">
                  <span>{activity.description}</span>
                  <span>بواسطة {activity.user}</span>
                  {activity.amount > 0 && (
                    <span className="activity-item__amount">${activity.amount.toFixed(2)}</span>
                  )}
                </div>
                <div className="activity-item__time">
                  {formatDistanceToNow(activity.time, { addSuffix: true, locale: ar })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}