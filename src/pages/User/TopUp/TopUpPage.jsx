import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useTopUpSettings } from '../../../context/TopUpSettingsContext';
import { db } from '../../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import GoBackButton from '../../../components/GeneralComponents/GoBackButton/GoBackButton';
import Button from '../../../components/GeneralComponents/Button/Button';
import Input from '../../../components/GeneralComponents/Input/Input';
import ImageUpload from '../../../components/GeneralComponents/ImageUpload/ImageUpload';
import { showToast } from '../../../components/GeneralComponents/ToastNotification/ToastNotification';
import './TopUpPage.css';

export default function TopUpPage() {
  const { userData } = useAuth();
  const { settings, loading: settingsLoading } = useTopUpSettings();
  const [selectedMethod, setSelectedMethod] = useState('usdt');
  const [amount, setAmount] = useState('');
  const [receiptImage, setReceiptImage] = useState('');
  const [loading, setLoading] = useState(false);

  if (settingsLoading) return <div>جاري تحميل طرق الدفع...</div>;

  const methods = [
    { id: 'usdt', name: 'USDT (تيثر)', icon: '₿', enabled: settings.usdt.enabled },
    { id: 'shamCash', name: 'شام كاش', icon: '🏦', enabled: settings.shamCash.enabled },
    { id: 'siretelCash', name: 'سيريتل كاش', icon: '📱', enabled: settings.siretelCash.enabled },
  ].filter(m => m.enabled);

  const currentMethod = settings[selectedMethod];

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
        paymentMethod: selectedMethod,
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
    <div className="topup-page" dir="rtl">
      <div className="topup-page__header">
        <GoBackButton text="رجوع" />
        <h2>شحن الرصيد</h2>
      </div>

      <div className="topup-page__methods">
        {methods.map(method => (
          <button
            key={method.id}
            className={`method-tab ${selectedMethod === method.id ? 'active' : ''}`}
            onClick={() => setSelectedMethod(method.id)}
          >
            <span className="method-icon">{method.icon}</span>
            {method.name}
          </button>
        ))}
      </div>

      <div className="topup-page__info">
        <h3>معلومات تحويل {methods.find(m => m.id === selectedMethod)?.name}</h3>
        {selectedMethod === 'usdt' && (
          <div className="info-card">
            <p><strong>عنوان المحفظة:</strong> <code>{currentMethod?.address || '—'}</code></p>
            <p><strong>الشبكة:</strong> {currentMethod?.network || 'TRC20'}</p>
            {currentMethod?.qrCode && (
              <div className="qr-code">
                <img src={currentMethod.qrCode} alt="QR Code" />
              </div>
            )}
          </div>
        )}
        {(selectedMethod === 'shamCash' || selectedMethod === 'siretelCash') && (
          <div className="info-card">
            <p><strong>اسم المستفيد:</strong> {currentMethod?.accountName || '—'}</p>
            <p><strong>رقم الحساب/الهاتف:</strong> {currentMethod?.accountNumber || '—'}</p>
            {currentMethod?.qrCode && (
              <div className="qr-code">
                <img src={currentMethod.qrCode} alt="QR Code" />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="topup-page__form">
        <h3>تقديم طلب شحن</h3>
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