// src/components/UserComponents/UserOrdersTable/UserOrdersTable.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../firebase';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import Loading from '../../GeneralComponents/Loading/Loading';
import './UserOrdersTable.css';

const statusLabels = {
  pending_verification: 'قيد التدقيق',
  awaiting_customer_resubmit: 'بانتظار تعديلك',
  verified_pending_execution: 'تم التدقيق - بانتظار التنفيذ',
  rejected: 'مرفوض',
  completed: 'مكتمل',
};

const orderTypes = {
  transfer: 'تحويل شام كاش',
  gaming: 'شحن ألعاب',
  crypto: 'عملات رقمية',
  exchange: 'صرافة',
};

export default function UserOrdersTable({ orderType, title, limitCount = 10 }) {
  const { userData } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData?.uid) {
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        let q;
        if (orderType === 'all') {
          q = query(
            collection(db, 'orders'),
            where('userId', '==', userData.uid),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
          );
        } else {
          q = query(
            collection(db, 'orders'),
            where('userId', '==', userData.uid),
            where('type', '==', orderType),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
          );
        }
        const snapshot = await getDocs(q);
        setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error(`خطأ في جلب طلبات ${orderType}:`, err);
        // في حال عدم وجود فهرس، نجلب بدون orderBy
        try {
          let q2;
          if (orderType === 'all') {
            q2 = query(collection(db, 'orders'), where('userId', '==', userData.uid));
          } else {
            q2 = query(collection(db, 'orders'), where('userId', '==', userData.uid), where('type', '==', orderType));
          }
          const snapshot2 = await getDocs(q2);
          let ordersList = snapshot2.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          ordersList.sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0));
          setOrders(ordersList.slice(0, limitCount));
        } catch (err2) {
          console.error(err2);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [userData, orderType, limitCount]);

  if (loading) return <Loading text="جاري تحميل الطلبات..." />;
  if (orders.length === 0) return <p className="user-orders-empty">لا توجد طلبات {title || ''} حتى الآن.</p>;

  return (
    <div className="user-orders-table" dir="rtl">
      <h3 className="user-orders-table__title">{title || 'طلباتي السابقة'}</h3>
      <div className="user-orders-table__wrapper">
        <table className="user-orders-table__table">
          <thead>
            <tr>
              <th>#</th>
              <th>التفاصيل</th>
              <th>المبلغ</th>
              <th>الحالة</th>
              <th>التاريخ</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id}>
                <td>#{order.id.slice(-6)}</td>
                <td>
                  {order.type === 'gaming' && `${order.gameName} - ${order.packageName} (${order.playerId})`}
                  {order.type === 'transfer' && `تحويل إلى ${order.recipientName} (${order.shamCashPhone})`}
                  {order.type === 'crypto' && `${order.tradeType === 'buy' ? 'شراء' : 'بيع'} ${order.amount} USDT`}
                  {order.type === 'exchange' && `${order.exchangeType === 'buy_dollar' ? 'شراء دولار' : 'بيع دولار'} - ${order.amount}`}
                </td>
                <td>{order.finalPrice || order.amount} {order.currency === 'USD' ? '$' : 'USD'}</td>
                <td><span className={`status-badge status-${order.status}`}>{statusLabels[order.status] || order.status}</span></td>
                <td>{order.createdAt?.toDate?.().toLocaleDateString('ar-SY') || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}