import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { db } from '../../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import Button from '../../GeneralComponents/Button/Button';
import Input from '../../GeneralComponents/Input/Input';
import ImageUpload from '../../GeneralComponents/ImageUpload/ImageUpload';
import GoBackButton from '../../GeneralComponents/GoBackButton/GoBackButton';
import { showToast } from '../../GeneralComponents/ToastNotification/ToastNotification';
import './UnifiedTopUpRequest.css';

export default function UnifiedTopUpRequest() {
  const { userData } = useAuth();
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('sham_cash');
  const [receiptImage, setReceiptImage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || amount <= 0) return showToast('المبلغ غير صالح', 'error');
    if (!receiptImage) return showToast('يرجى رفع إيصال الدفع', 'error');

    setLoading(true);
    try {
      await addDoc(collection(db, 'topUpRequests'), {
        userId: userData.uid,
        userName: userData.name,
        amount: parseFloat(amount),
        paymentMethod,
        receiptImage,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      showToast('✅ تم إرسال طلب الشحن، سيتم مراجعته قريباً', 'success');
      setAmount('');
      setReceiptImage('');
    } catch (error) {
      console.error(error);
      showToast('فشل إرسال الطلب', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="unified-topup" dir="rtl">
      <div className="unified-topup__back">
        <GoBackButton text="رجوع" />
      </div>
      <h2 className="unified-topup__title">شحن الرصيد</h2>
      <div className="unified-topup__form">
        <form onSubmit={handleSubmit}>
          <Input
            label="المبلغ (دولار أمريكي)"
            type="number"
            step="1"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <div className="unified-topup__field">
            <label>طريقة الدفع</label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option value="sham_cash">شام كاش</option>
              <option value="usdt">USDT (تيثر)</option>
              <option value="siretel_cash">سيريتل كاش</option>
            </select>
          </div>
          <ImageUpload
            label="إيصال الدفع (صورة)"
            onUploadComplete={setReceiptImage}
            maxSizeMB={0.5}
            disabled={loading}
          />
          <Button type="submit" disabled={loading}>
            {loading ? 'جاري الإرسال...' : 'تقديم طلب شحن'}
          </Button>
        </form>
      </div>
    </div>
  );
}