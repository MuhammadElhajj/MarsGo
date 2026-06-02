import { useState, useEffect, Suspense, lazy } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import Button from '../../../components/GeneralComponents/Button/Button';
import Input from '../../../components/GeneralComponents/Input/Input';
import ImageUpload from '../../../components/GeneralComponents/ImageUpload/ImageUpload';
import Loading from '../../../components/GeneralComponents/Loading/Loading';
import './ExchangePage.css';

const OrdersList = lazy(() => import('../../../components/UserComponents/OrdersList/OrdersList'));

export default function ExchangePage() {
  const { userData } = useAuth();
  const [exchangeType, setExchangeType] = useState('buy_dollar');
  const [amount, setAmount] = useState('');
  const [rate, setRate] = useState('');
  const [receiptImageBase64, setReceiptImageBase64] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!amount || !rate) {
      setError('يرجى ملء جميع الحقول');
      return;
    }
    if (!receiptImageBase64) {
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
        receiptImage: receiptImageBase64,
        status: 'pending_verification',
        createdAt: serverTimestamp(),
      });
      setSuccess(true);
      setAmount('');
      setRate('');
      setReceiptImageBase64('');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setError('فشل إرسال الطلب: ' + err.message);
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
          <ImageUpload
            label="إيصال الدفع"
            onUploadComplete={setReceiptImageBase64}
            maxSizeMB={0.5}
            disabled={loading}
          />
          <Button type="submit" disabled={loading}>
            {loading ? 'جاري...' : 'إرسال الطلب'}
          </Button>
        </form>
      </div>

      <Suspense fallback={<Loading text="جاري تحميل الطلبات..." />}>
        <OrdersList orderType="exchange" title="طلبات الصرافة السابقة" limitCount={10} />
      </Suspense>
    </div>
  );
}