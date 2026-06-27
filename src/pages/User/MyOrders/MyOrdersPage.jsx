// src/pages/User/MyOrders/MyOrdersPage.jsx
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../firebase';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import Loading from '../../../components/GeneralComponents/Loading/Loading';
import { ORDER_STATUS_LABELS, ORDER_TYPE_LABELS } from '../../../constants/orderConstants';
import './MyOrdersPage.css';

export default function MyOrdersPage() {
  const { userData } = useAuth();
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [error, setError] = useState('');

  // جلب الطلبات مرة واحدة مع حد أقصى 10 طلب (لتحسين الأداء)
  const fetchOrders = async () => {
    if (!userData?.uid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      let q = query(
        collection(db, 'orders'),
        where('userId', '==', userData.uid),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const snapshot = await getDocs(q);
      const ordersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllOrders(ordersList);
    } catch (err) {
      console.error('Firestore error:', err);
      if (err.code === 'failed-precondition') {
        try {
          const q2 = query(
            collection(db, 'orders'),
            where('userId', '==', userData.uid),
            limit(10)
          );
          const snapshot2 = await getDocs(q2);
          let ordersList2 = snapshot2.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          ordersList2.sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || new Date(0);
            const dateB = b.createdAt?.toDate?.() || new Date(0);
            return dateB - dateA;
          });
          setAllOrders(ordersList2);
        } catch (err2) {
          setError('الرجاء إنشاء الفهرس المطلوب. تحقق من رابط الخطأ في Console (F12).');
        }
      } else {
        setError('حدث خطأ في جلب الطلبات: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [userData]);

  const filteredOrders = useMemo(() => {
    if (filterType === 'all') return allOrders;
    return allOrders.filter(order => order.type === filterType);
  }, [allOrders, filterType]);

  const handleFilterChange = (type) => setFilterType(type);

  if (loading) return <Loading text="جاري تحميل طلباتك..." />;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="my-orders-page" dir="rtl">
      <div className="my-orders-header">
        {/* <h2 className="my-orders-page__title">طلباتي</h2> */}
        <div></div>
      </div>

      <div className="filter-buttons">
        <button className={filterType === 'all' ? 'active' : ''} onClick={() => handleFilterChange('all')}>الكل</button>
        <button className={filterType === 'gaming' ? 'active' : ''} onClick={() => handleFilterChange('gaming')}> ألعاب</button>
        <button className={filterType === 'transfer' ? 'active' : ''} onClick={() => handleFilterChange('transfer')}> تحويل</button>
        <button className={filterType === 'crypto' ? 'active' : ''} onClick={() => handleFilterChange('crypto')}> عملات</button>
        <button className={filterType === 'exchange' ? 'active' : ''} onClick={() => handleFilterChange('exchange')}> صرافة</button>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="empty-orders"> لا توجد طلبات حتى الآن</div>
      ) : (
        <div className="orders-table-wrapper">
          <table className="orders-table">
            <thead>
              <tr>
                <th>رقم الطلب</th><th>النوع</th><th>التفاصيل</th><th>المبلغ</th><th>الحالة</th><th>التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order.id}>
                  <td>{order.id.slice(-6)}</td>
                  <td>{ORDER_TYPE_LABELS[order.type] || order.type}</td>
                  <td>
                    {order.type === 'gaming' && `${order.gameName} - ${order.packageName} (${order.playerId})`}
                    {order.type === 'transfer' && `${order.recipientName} - ${order.shamCashPhone}`}
                    {order.type === 'crypto' && `${order.tradeType === 'buy' ? 'شراء' : 'بيع'} ${order.amount} USDT`}
                    {order.type === 'exchange' && `${order.exchangeType === 'buy_dollar' ? 'شراء دولار' : 'بيع دولار'} - ${order.amount}`}
                  </td>
                  <td>{order.finalPrice || order.amount} {order.currency === 'USD' ? '$' : order.currency || 'USD'}</td>
                  <td><span className={`status-badge status-${order.status}`}>{ORDER_STATUS_LABELS[order.status] || order.status}</span></td>
                  <td>{order.createdAt?.toDate?.().toLocaleDateString('ar-SY') || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}