import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../firebase';
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore'; // أزلنا orderBy, limit
import Button from '../../../components/GeneralComponents/Button/Button';
import Input from '../../../components/GeneralComponents/Input/Input';
import './CryptoPage.css';

export default function CryptoPage() {
  const { userData } = useAuth();
  const [tradeType, setTradeType] = useState('buy');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('شام كاش');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const fetchOrders = async () => {
    if (!userData?.uid) {
      setOrdersLoading(false);
      return;
    }
    try {
      // جلب طلبات المستخدم الحالي فقط من نوع crypto
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', userData.uid),
        where('type', '==', 'crypto')
      );
      const snap = await getDocs(q);
      let ordersList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // ترتيب يدوي تنازلي حسب createdAt (إذا كان الحقل موجوداً)
      ordersList.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
        return dateB - dateA;
      });
      setOrders(ordersList);
    } catch (err) {
      console.error('خطأ في جلب طلبات العملات الرقمية:', err);
      setError('حدث خطأ في تحميل الطلبات');
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [userData]); // إعادة الجلب عند تغير المستخدم

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!amount || !price) {
      setError('يرجى إدخال المبلغ والسعر');
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, 'orders'), {
        userId: userData.uid,
        customerName: userData.name || '',
        type: 'crypto',
        tradeType,
        amount: parseFloat(amount),
        price: parseFloat(price),
        paymentMethod,
        status: 'pending_verification', // استخدم نفس نظام الحالات المستخدم في باقي الأقسام
        createdAt: serverTimestamp(),
      });
      setSuccess(true);
      setAmount('');
      setPrice('');
      fetchOrders(); // إعادة تحميل الطلبات بعد الإضافة
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setError('فشل إرسال الطلب: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="crypto-page" dir="rtl">
      <h2 className="crypto-page__title">العملات الرقمية</h2>
      <div className="crypto-page__notice">
        هذه الخدمة قيد الترخيص - يمكنك تقديم طلبات وسيتم تفعيل المطابقة عند توفر التراخيص.
      </div>

      <div className="crypto-page__form">
        {success && <div className="crypto-page__success">تم إضافة طلبك بنجاح!</div>}
        {error && <div className="crypto-page__error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="crypto-page__field">
            <label>نوع العملية</label>
            <select value={tradeType} onChange={e => setTradeType(e.target.value)}>
              <option value="buy">شراء</option>
              <option value="sell">بيع</option>
            </select>
          </div>
          <Input
            label="الكمية (USDT)"
            type="number"
            step="any"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            required
          />
          <Input
            label="السعر المطلوب (دولار/يورو)"
            type="number"
            step="any"
            value={price}
            onChange={e => setPrice(e.target.value)}
            required
          />
          <Input
            label="طريقة الدفع"
            value={paymentMethod}
            onChange={e => setPaymentMethod(e.target.value)}
            required
          />
          <Button type="submit" disabled={loading}>
            {loading ? 'جاري...' : 'إضافة الطلب'}
          </Button>
        </form>
      </div>

      <div className="crypto-page__orders">
        <h3>طلباتي في العملات الرقمية</h3>
        {ordersLoading ? <p>جاري التحميل...</p> : orders.length === 0 ? (
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