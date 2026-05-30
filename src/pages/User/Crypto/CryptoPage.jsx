import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../firebase';
import { collection, addDoc, query, where, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore';
import Button from '../../../components/GeneralComponents/Button/Button';
import Input from '../../../components/GeneralComponents/Input/Input';
import './CryptoPage.css';

export default function CryptoPage() {
  const { userData } = useAuth();
  const [tradeType, setTradeType] = useState('buy'); // buy or sell
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('شام كاش');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const q = query(
        collection(db, 'orders'),
        where('type', '==', 'crypto'),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      const snap = await getDocs(q);
      setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

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
        tradeType, // buy/sell
        amount: parseFloat(amount),
        price: parseFloat(price),
        paymentMethod,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      setSuccess(true);
      setAmount('');
      setPrice('');
      fetchOrders();
    } catch (err) {
      console.error(err);
      setError('فشل إرسال الطلب');
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
        <h3>الطلبات النشطة</h3>
        {ordersLoading ? <p>جاري التحميل...</p> : orders.length === 0 ? (
          <p>لا توجد طلبات نشطة حالياً</p>
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
                  <td>{order.amount}</td>
                  <td>{order.price}</td>
                  <td>{order.paymentMethod}</td>
                  <td>{order.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}