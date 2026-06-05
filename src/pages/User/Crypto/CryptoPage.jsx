// src/pages/User/Crypto/CryptoPage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import UnifiedCheckout from '../../../components/Generic/UnifiedCheckout/UnifiedCheckout';
import GoBackButton from '../../../components/GeneralComponents/GoBackButton/GoBackButton';
import HowItWorks from '../../../components/UserComponents/HowItWorks/HowItWorks';
import './CryptoPage.css';

export default function CryptoPage() {
  const { userData } = useAuth();
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const fetchOrders = async () => {
    if (!userData?.uid) {
      setOrdersLoading(false);
      return;
    }
    try {
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', userData.uid),
        where('type', '==', 'crypto')
      );
      const snap = await getDocs(q);
      let ordersList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      ordersList.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
        return dateB - dateA;
      });
      setOrders(ordersList);
    } catch (err) {
      console.error('خطأ في جلب طلبات العملات الرقمية:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [userData]);

  return (
    <div className="crypto-page" dir="rtl">
      {/* زر الرجوع */}
      <div style={{ marginBottom: '1rem' }}>
        <GoBackButton text="رجوع إلى لوحة التحكم" />
      </div>

      <h2 className="crypto-page__title">العملات الرقمية</h2>

      {/* مكون التعليمات خاص بصفحة العملات الرقمية */}
      <HowItWorks page="crypto" />

      <div className="crypto-page__notice">
        هذه الخدمة قيد الترخيص - يمكنك تقديم طلبات وسيتم تفعيل المطابقة عند توفر التراخيص.
      </div>

      {/* ✅ نموذج الدفع الموحد */}
      <UnifiedCheckout serviceType="crypto" redirectPath="/dashboard" />

      <div className="crypto-page__orders">
        <h3>طلباتي في العملات الرقمية</h3>
        {ordersLoading ? (
          <p>جاري التحميل...</p>
        ) : orders.length === 0 ? (
          <p>لا توجد طلبات عملات رقمية حتى الآن</p>
        ) : (
          <table className="crypto-page__table">
            <thead>
              <tr>
                <th>النوع</th>
                <th>الكمية</th>
                <th>السعر</th>
                <th>طريقة الدفع</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td>{order.tradeType === 'buy' ? 'شراء' : 'بيع'}</td>
                  <td>{order.amount} USDT</td>
                  <td>{order.price} $</td>
                  <td>{order.paymentMethod}</td>
                  <td>{order.status === 'pending_verification' ? 'قيد التدقيق' : order.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}