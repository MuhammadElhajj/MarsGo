import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import Loading from '../../../components/GeneralComponents/Loading/Loading';
import GoBackButton from '../../../components/GeneralComponents/GoBackButton/GoBackButton';
import './MyOrdersPage.css';

const orderTypes = {
  gaming: 'شحن ألعاب',
  transfer: 'تحويل شام كاش',
  crypto: 'عملات رقمية',
  exchange: 'صرافة',
};

const statusLabels = {
  pending_verification: 'قيد التدقيق',
  awaiting_customer_resubmit: 'بانتظار تعديلك',
  verified_pending_execution: 'تم التدقيق',
  rejected: 'مرفوض',
  completed: 'مكتمل',
};

export default function MyOrdersPage() {
  const { userData } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // 'all', 'gaming', 'transfer', 'crypto', 'exchange'

  const fetchOrders = async () => {
    if (!userData?.uid) return;
    setLoading(true);
    try {
      let q = query(
        collection(db, 'orders'),
        where('userId', '==', userData.uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      let allOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      if (filterType !== 'all') {
        allOrders = allOrders.filter(order => order.type === filterType);
      }
      
      setOrders(allOrders);
    } catch (err) {
      console.error('خطأ في جلب الطلبات:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [userData, filterType]);

  const handleFilterChange = (type) => {
    setFilterType(type);
  };

  if (loading) return <Loading text="جاري تحميل طلباتك..." />;

  return (
    <div className="my-orders-page" dir="rtl">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <GoBackButton text="رجوع" />
        <h2 className="my-orders-page__title">طلباتي</h2>
        <div></div> {/* فراغ للمحاذاة */}
      </div>

      {/* فلترة حسب النوع */}
      <div className="filter-buttons">
        <button className={filterType === 'all' ? 'active' : ''} onClick={() => handleFilterChange('all')}>الكل</button>
        <button className={filterType === 'gaming' ? 'active' : ''} onClick={() => handleFilterChange('gaming')}>🎮 شحن ألعاب</button>
        <button className={filterType === 'transfer' ? 'active' : ''} onClick={() => handleFilterChange('transfer')}>💸 تحويل شام كاش</button>
        <button className={filterType === 'crypto' ? 'active' : ''} onClick={() => handleFilterChange('crypto')}>₿ عملات رقمية</button>
        <button className={filterType === 'exchange' ? 'active' : ''} onClick={() => handleFilterChange('exchange')}>🔄 صرافة</button>
      </div>

      {orders.length === 0 ? (
        <div className="empty-orders">لا توجد طلبات</div>
      ) : (
        <div className="orders-table-wrapper">
          <table className="orders-table">
            <thead>
              <tr>
                <th>رقم الطلب</th>
                <th>النوع</th>
                <th>التفاصيل</th>
                <th>المبلغ</th>
                <th>الحالة</th>
                <th>التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td>#{order.id.slice(-8)}</td>
                  <td>{orderTypes[order.type] || order.type}</td>
                  <td>
                    {order.type === 'gaming' && `${order.gameName} - ${order.packageName} (ID: ${order.playerId})`}
                    {order.type === 'transfer' && `إلى: ${order.recipientName} - ${order.shamCashPhone}`}
                    {order.type === 'crypto' && `${order.tradeType === 'buy' ? 'شراء' : 'بيع'} ${order.amount} USDT`}
                    {order.type === 'exchange' && `${order.exchangeType === 'buy_dollar' ? 'شراء دولار' : 'بيع دولار'} - المبلغ: ${order.amount}`}
                   </td>
                  <td>
                    {order.finalPrice || order.amount} {order.currency === 'USD' ? '$' : order.currency || 'USD'}
                   </td>
                  <td>
                    <span className={`status-badge status-${order.status}`}>
                      {statusLabels[order.status] || order.status}
                    </span>
                   </td>
                  <td>
                    {order.createdAt?.toDate().toLocaleDateString('ar-SY') || '—'}
                   </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}