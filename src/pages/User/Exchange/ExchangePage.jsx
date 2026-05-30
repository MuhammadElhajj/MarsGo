import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../firebase';
import { collection, addDoc, query, where, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore';
import Button from '../../../components/GeneralComponents/Button/Button';
import Input from '../../../components/GeneralComponents/Input/Input';
import ImageUpload from '../../../components/GeneralComponents/ImageUpload/ImageUpload';
import './ExchangePage.css';

export default function ExchangePage() {
  const { userData } = useAuth();
  const [exchangeType, setExchangeType] = useState('buy_dollar');
  const [amount, setAmount] = useState('');
  const [rate, setRate] = useState('');
  const [receiptImage, setReceiptImage] = useState(null); // ← للملف المضغوط
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState([]);

  const fetchOrders = async () => {
    if (!userData?.uid) return;
    try {
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', userData.uid),
        where('type', '==', 'exchange'),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const snap = await getDocs(q);
      setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [userData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!amount || !rate) {
      setError('يرجى ملء جميع الحقول');
      return;
    }
    if (!receiptImage) {
      setError('يرجى رفع إيصال الدفع');
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, 'orders'), {
        userId: userData.uid,
        customerName: userData.name || '',
        type: 'exchange',
        exchangeType,
        amount: parseFloat(amount),
        rate: parseFloat(rate),
        receiptImageRef: receiptImage.name, // ← اسم الملف المضغوط
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      setSuccess(true);
      setAmount('');
      setRate('');
      setReceiptImage(null);
      fetchOrders();
    } catch (err) {
      console.error(err);
      setError('فشل إرسال الطلب');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="exchange-page" dir="rtl">
      <h2 className="exchange-page__title">صرافة شام كاش</h2>
      <div className="exchange-page__form">
        {success && <div className="exchange-page__success">تم تقديم طلب الصرافة بنجاح!</div>}
        {error && <div className="exchange-page__error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="exchange-page__field">
            <label>نوع العملية</label>
            <select value={exchangeType} onChange={e => setExchangeType(e.target.value)}>
              <option value="buy_dollar">شراء دولار (أدفع ليرة وأستلم دولار)</option>
              <option value="sell_dollar">بيع دولار (أدفع دولار وأستلم ليرة)</option>
            </select>
          </div>
          <Input
            label="المبلغ"
            type="number"
            step="any"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            required
          />
          <Input
            label="سعر الصرف المقترح"
            type="number"
            step="any"
            value={rate}
            onChange={e => setRate(e.target.value)}
            required
          />

          {/* إضافة حقل رفع إيصال الدفع */}
          <ImageUpload
            label="إيصال الدفع"
            onFileReady={setReceiptImage}
            maxSizeMB={0.5}
            disabled={loading}
          />

          <Button type="submit" disabled={loading}>
            {loading ? 'جاري...' : 'إرسال الطلب'}
          </Button>
        </form>
      </div>

      <div className="exchange-page__orders">
        <h3>طلبات الصرافة السابقة</h3>
        {orders.length === 0 ? (
          <p>لا توجد طلبات صرافة بعد</p>
        ) : (
          <table className="exchange-page__table">
            <thead>
              <tr>
                <th>النوع</th>
                <th>المبلغ</th>
                <th>السعر</th>
                <th>الحالة</th>
                <th>التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td>{order.exchangeType === 'buy_dollar' ? 'شراء دولار' : 'بيع دولار'}</td>
                  <td>{order.amount}</td>
                  <td>{order.rate}</td>
                  <td>{order.status}</td>
                  <td>{order.createdAt?.toDate().toLocaleDateString('ar-SY') || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}