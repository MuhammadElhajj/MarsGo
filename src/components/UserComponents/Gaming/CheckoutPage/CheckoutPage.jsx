// src/pages/User/Gaming/CheckoutPage.jsx
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import { db } from '../../../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import Button from '../../../GeneralComponents/Button/Button';
import Input from '../../../GeneralComponents/Input/Input';
import ImageUpload from '../../../GeneralComponents/ImageUpload/ImageUpload';
import PaymentButton from '../../../GeneralComponents/PaymentButton/PaymentButton';
import GoBackButton from '../../../GeneralComponents/GoBackButton/GoBackButton';
import './CheckoutPage.css';

export default function CheckoutPage() {
  const { userData } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { game, package: selectedPackage } = location.state || {};

  const [playerId, setPlayerId] = useState('');
  const [receiptImageBase64, setReceiptImageBase64] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!game || !selectedPackage) {
    return (
      <div className="gaming-page" dir="rtl">
        <GoBackButton text="رجوع" onClick={() => navigate('/gaming')} />
        <p>بيانات غير مكتملة، يرجى اختيار لعبة وباقة أولاً.</p>
      </div>
    );
  }

  const finalPrice = selectedPackage.discount
    ? (selectedPackage.price * (1 - selectedPackage.discount / 100)).toFixed(2)
    : selectedPackage.price;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!playerId) return setError('يرجى إدخال ID اللاعب');
    if (!receiptImageBase64) return setError('يرجى رفع إيصال الدفع');
    setLoading(true);
    try {
      await addDoc(collection(db, 'orders'), {
        userId: userData.uid,
        customerName: userData.name || '',
        type: 'gaming',
        gameId: game.id,
        gameName: game.name,
        packageId: selectedPackage.id,
        packageName: selectedPackage.name,
        price: selectedPackage.price,
        finalPrice: parseFloat(finalPrice),
        currency: selectedPackage.currency || 'USD',
        discount: selectedPackage.discount || 0,
        playerId,
        receiptImage: receiptImageBase64,
        status: 'pending_verification',
        createdAt: serverTimestamp(),
      });
      setSuccess(true);
      setPlayerId('');
      setReceiptImageBase64('');
      setTimeout(() => navigate('/gaming'), 3000);
    } catch (err) {
      console.error(err);
      setError('حدث خطأ أثناء إرسال الطلب');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gaming-page" dir="rtl">
      <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '1rem' }}>
        <GoBackButton text="رجوع إلى الباقات" />
      </div>
      <h2 className="gaming-page__title">إتمام عملية الشحن</h2>
      <div className="order-form">
        <h3>طلب شحن: {game.name} - {selectedPackage.name}</h3>
        <form onSubmit={handleSubmit}>
          <Input
            label="ID اللاعب"
            value={playerId}
            onChange={e => setPlayerId(e.target.value)}
            required
          />
          <div className="price-summary">
            <span>المبلغ المطلوب:</span>
            <strong>{finalPrice} {selectedPackage.currency === 'USD' ? '$' : 'ل.س'}</strong>
            {selectedPackage.discount && <small> (بعد خصم {selectedPackage.discount}%)</small>}
          </div>
          <ImageUpload
            label="إيصال الدفع"
            onUploadComplete={setReceiptImageBase64}
            maxSizeMB={0.5}
            disabled={loading}
          />
          <PaymentButton text="ادفع عبر QR" variant="secondary" />
          <Button type="submit" disabled={loading || !receiptImageBase64}>
            {loading ? 'جاري الإرسال...' : 'إرسال الطلب'}
          </Button>
          {success && <p className="success-message">تم إرسال طلبك بنجاح! جاري تحويلك...</p>}
          {error && <p className="error-message">{error}</p>}
        </form>
      </div>
    </div>
  );
}