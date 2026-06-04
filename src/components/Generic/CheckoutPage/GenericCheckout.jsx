
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useExchangeRate } from '../../../context/ExchangeRateContext';
import { useCurrency } from '../../../context/CurrencyContext';
import { db } from '../../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import Button from '../../GeneralComponents/Button/Button';
import Input from '../../GeneralComponents/Input/Input';
import ImageUpload from '../../GeneralComponents/ImageUpload/ImageUpload';
import PaymentButton from '../../GeneralComponents/PaymentButton/PaymentButton';
import GoBackButton from '../../GeneralComponents/GoBackButton/GoBackButton';
import { showToast } from '../../GeneralComponents/ToastNotification/ToastNotification';
import { useNotifications } from '../../../context/NotificationContext'; // ✅ استيراد الإشعارات
import './GenericCheckout.css';
import { sendWhatsAppNotification, formatOrderMessage } from '../../../utils/sendWhatsAppNotification';

export default function GenericCheckout({ orderType, redirectPath }) {
  const { userData } = useAuth();
  const { rate } = useExchangeRate();
  const { currency } = useCurrency();
  const { addNotification } = useNotifications(); // ✅ جلب دالة إضافة الإشعار
  const navigate = useNavigate();
  const location = useLocation();
  const { item, package: pkg } = location.state || {};

  const [playerId, setPlayerId] = useState('');
  const [receiptImageBase64, setReceiptImageBase64] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // ✅ تم إزالة success لأننا نستخدم الإشعارات المنبثقة

  if (!item || !pkg) {
    return (
      <div className="gaming-page" dir="rtl">
        <GoBackButton text="رجوع" onClick={() => navigate(redirectPath || '/dashboard')} />
        <p style={{ color: 'red', marginTop: '1rem' }}>⚠️ لم يتم تحديد خدمة أو باقة. الرجاء اختيار الخدمة أولاً.</p>
      </div>
    );
  }

  // السعر الأساسي بالدولار
  const priceUSD = typeof pkg.price === 'number' ? pkg.price : parseFloat(pkg.price);
  const finalPriceUSD = pkg.discount ? (priceUSD * (1 - pkg.discount / 100)) : priceUSD;
  
  // السعر المعروض حسب العملة
  const displayPrice = currency === 'USD' 
    ? `${finalPriceUSD} $`
    : rate ? `${(finalPriceUSD * rate).toFixed(0).toLocaleString()} ل.س` : '...';

  const handleSubmit = async (e) => {
    e.preventDefault();
    // ✅ منع الإرسال المتعدد
    if (loading) return;
    
    setError('');
    if (!playerId) return setError('يرجى إدخال المعرف (ID اللاعب أو رقم الحساب)');
    if (!receiptImageBase64) return setError('يرجى رفع إيصال الدفع');
    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, 'orders'), {
        userId: userData.uid,
        customerName: userData.name || '',
        type: orderType,
        itemId: item.id,
        itemName: item.name,
        packageId: pkg.id,
        packageName: pkg.name,
        priceUSD: priceUSD,
        finalPriceUSD: finalPriceUSD,
        exchangeRateAtPurchase: rate || null,
        currencyUsed: currency,
        playerId,
        receiptImage: receiptImageBase64,
        status: 'pending_verification',
        createdAt: serverTimestamp(),
      });
      
      // إرسال إشعار واتساب
// إرسال إشعار واتساب مع الصورة
// إرسال إشعار واتساب مع الصورة
const orderDataForWhatsApp = {
  itemName: item.name,
  packageName: pkg.name,
  playerId: playerId,
  finalPriceUSD: finalPriceUSD,
  currencyUsed: currency,
  customerName: userData.name || '',
};
const message = formatOrderMessage(orderDataForWhatsApp, docRef.id, orderType);
sendWhatsAppNotification(null, message, receiptImageBase64); // ✅ تمت إضافة المعامل الثالث
      // ✅ إضافة إشعار للمستخدم
      await addNotification(
        userData.uid,
        '📦 طلب جديد',
        `طلب #${docRef.id.slice(-6)} - ${item.name} - ${pkg.name} قيد المراجعة`,
        'order_created',
        docRef.id,
        '/my-orders'
      );
      
      // ✅ إشعار نجاح منبثق
      showToast('✅ تم إرسال طلبك بنجاح! سنقوم بمراجعته قريباً.', 'success', 4000);
      setPlayerId('');
      setReceiptImageBase64('');
      setTimeout(() => navigate(redirectPath || '/dashboard'), 3000);
    } catch (err) {
      console.error(err);
      showToast('❌ حدث خطأ أثناء إرسال الطلب: ' + err.message, 'error', 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="generic-checkout" dir="rtl">
      <div style={{ marginBottom: '1rem' }}>
        <GoBackButton text="رجوع إلى الباقات" />
      </div>
      <h2 className="generic-checkout__title">إتمام عملية الشراء</h2>
      <div className="generic-checkout__form">
        <h3>طلب شراء: {item.name} - {pkg.name}</h3>
        <form onSubmit={handleSubmit}>
          <Input
            label="المعرف (ID اللاعب / رقم الحساب)"
            value={playerId}
            onChange={e => setPlayerId(e.target.value)}
            required
          />
          <div className="generic-checkout__price-summary">
            <span>المبلغ المطلوب:</span>
            <strong>{displayPrice}</strong>
            {pkg.discount > 0 && <small> (بعد خصم {pkg.discount}%)</small>}
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
          {error && <p className="generic-checkout__error">❌ {error}</p>}
        </form>
      </div>
    </div>
  );
}