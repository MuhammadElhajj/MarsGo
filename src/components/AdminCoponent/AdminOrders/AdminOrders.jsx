import { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, query, where, orderBy, getDocs, updateDoc, doc, limit } from 'firebase/firestore';
import Button from '../../GeneralComponents/Button/Button';
import Input from '../../GeneralComponents/Input/Input';
import './AdminOrders.css';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processNumbers, setProcessNumbers] = useState({});
  const [actionLoading, setActionLoading] = useState(null);

  const fetchOrders = async () => {
    try {
      const q = query(
        collection(db, 'orders'),
        where('status', '==', 'verified_pending_execution'),
        orderBy('verifiedAt', 'asc'),
        limit(50)  // ✅ إضافة حد أقصى لتحسين الأداء
      );
      const snap = await getDocs(q);
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleExecute = async (orderId) => {
    const processNumber = processNumbers[orderId];
    if (!processNumber) return alert('الرجاء إدخال رقم عملية شام كاش');

    setActionLoading(orderId);
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'completed',
        shamCashProcessNumber: processNumber,
        completedAt: new Date(),
      });
      setOrders(prev => prev.filter(o => o.id !== orderId));
      setProcessNumbers(prev => {
        const newState = { ...prev };
        delete newState[orderId];
        return newState;
      });
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <p>جاري تحميل الطلبات...</p>;

  return (
    <div className="admin-orders">
      <h2 className="admin-orders__title">تنفيذ الطلبات الجاهزة</h2>
      {orders.length === 0 ? (
        <p className="admin-orders__empty">لا توجد طلبات جاهزة للتنفيذ حالياً.</p>
      ) : (
        <div className="admin-orders__list">
          {orders.map(order => (
            <div key={order.id} className="admin-orders__card">
              <div className="admin-orders__card-header">
                <span>طلب #{order.id.slice(-6)}</span>
                <span className="admin-orders__status">تم التدقيق</span>
              </div>
              <div className="admin-orders__details">
                <p><strong>المستلم:</strong> {order.recipientName}</p>
                <p><strong>رقم شام كاش:</strong> {order.shamCashPhone}</p>
                <p><strong>المبلغ:</strong> {order.amount} $</p>
                <p><strong>مدقق الطلب:</strong> {order.verifiedBy || '—'}</p>
              </div>
              <div className="admin-orders__action">
                <Input
                  placeholder="رقم عملية شام كاش"
                  value={processNumbers[order.id] || ''}
                  onChange={e => setProcessNumbers(prev => ({ ...prev, [order.id]: e.target.value }))}
                />
                <Button
                  onClick={() => handleExecute(order.id)}
                  disabled={actionLoading === order.id}
                >
                  {actionLoading === order.id ? 'جاري...' : 'تنفيذ التحويل'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}