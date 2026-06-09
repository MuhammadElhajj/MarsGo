// src/components/Generic/UnifiedCheckout/UnifiedCheckout.jsx
import { useState, lazy, Suspense } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useBalance } from '../../../context/BalanceContext';
import { useExchangeRate } from '../../../context/ExchangeRateContext';
import { useCurrency } from '../../../context/CurrencyContext';
import { db } from '../../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import Button from '../../GeneralComponents/Button/Button';
import GoBackButton from '../../GeneralComponents/GoBackButton/GoBackButton';
import { showToast } from '../../GeneralComponents/ToastNotification/ToastNotification';
import { useNotifications } from '../../../context/NotificationContext';
import { sendWhatsAppNotification, formatOrderMessage } from '../../../utils/sendWhatsAppNotification';
import Loading from '../../GeneralComponents/Loading/Loading';
import useFinalPrice from '../../../hooks/useFinalPrice'; // ✅ استيراد الهوك الجديد
import './UnifiedCheckout.css';

// استيراد النماذج بشكل lazy
const GamingAppsForm = lazy(() => import('./forms/GamingAppsForm'));
// سيتم تفعيلها لاحقاً عند الحاجة
// const TransferForm = lazy(() => import('./forms/TransferForm'));
// const CryptoForm = lazy(() => import('./forms/CryptoForm'));
// const ExchangeForm = lazy(() => import('./forms/ExchangeForm'));

export default function UnifiedCheckout({ serviceType, redirectPath }) {
  const { userData } = useAuth();
  const { balance, deductBalance } = useBalance();
  const { rate } = useExchangeRate();
  const { currency } = useCurrency();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const { item, package: pkg } = location.state || {};

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // حقول النماذج
  const [playerId, setPlayerId] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [shamCashPhone, setShamCashPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [tradeType, setTradeType] = useState('buy');
  const [price, setPrice] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('شام كاش');
  const [exchangeType, setExchangeType] = useState('buy_dollar');
  const [rateExchange, setRateExchange] = useState('');

  const needsItemAndPackage = ['gaming', 'apps'].includes(serviceType);
  if (needsItemAndPackage && (!item || !pkg)) {
    return (
      <div className="unified-checkout" dir="rtl">
        <GoBackButton text="رجوع" onClick={() => navigate(redirectPath || '/dashboard')} />
        <p className="unified-checkout__error">⚠️ لم يتم تحديد خدمة أو باقة. الرجاء اختيار الخدمة أولاً.</p>
      </div>
    );
  }

  // تحديد نوع المنتج للخصم العام (فقط للألعاب والتطبيقات)
  const productType = (serviceType === 'gaming') ? 'game' : (serviceType === 'apps') ? 'app' : null;
  
  // حساب السعر باستخدام الهوك الموحد (يجمع الخصم العام وخصم الباقة وخصم التاجر)
  let requiredAmountUSD = 0;
  let displayPrice = '';
  let priceUSD = 0;
  let packageDiscount = 0;

  if (needsItemAndPackage && pkg) {
    priceUSD = typeof pkg.price === 'number' ? pkg.price : parseFloat(pkg.price);
    packageDiscount = pkg.discount || 0;
    // استدعاء الهوك خارج الشرط (لكن يجب أن يكون في نفس الترتيب دائماً)
    // سنستخدمه بعد قليل، لكن لا يمكن استدعاؤه داخل if.
    // لذلك سنستدعيه بشكل ثابت ثم نستخدم النتيجة.
  }

  // استدعاء الهوك (يجب أن يكون خارج أي شرط ودائماً بنفس الترتيب)
  // نمرر قيماً افتراضية آمنة إذا لم تكن الخدمة من النوع المناسب
  const hookProductId = (needsItemAndPackage && item?.id) ? item.id : null;
  const hookOriginalPrice = (needsItemAndPackage && pkg) ? priceUSD : 0;
  const hookItemDiscount = (needsItemAndPackage && pkg) ? packageDiscount : 0;
  const { finalPrice: computedPrice, discountPercent: computedDiscount } = useFinalPrice(
    productType,
    hookProductId,
    hookOriginalPrice,
    hookItemDiscount
  );

  if (needsItemAndPackage && pkg) {
    requiredAmountUSD = computedPrice;
    displayPrice = currency === 'USD'
      ? `${requiredAmountUSD.toFixed(2)} $`
      : rate ? `${(requiredAmountUSD * rate).toFixed(0).toLocaleString()} ل.س` : '...';
  } else if (serviceType === 'transfer') {
    requiredAmountUSD = parseFloat(amount) || 0;
    displayPrice = `${requiredAmountUSD} $`;
  } else if (serviceType === 'crypto') {
    requiredAmountUSD = parseFloat(price) || 0;
    displayPrice = `${requiredAmountUSD} $`;
  } else if (serviceType === 'exchange') {
    requiredAmountUSD = parseFloat(amount) || 0;
    displayPrice = `${requiredAmountUSD} $`;
  }

  const validateForm = () => {
    if (serviceType === 'gaming' || serviceType === 'apps') {
      if (!playerId) return 'يرجى إدخال المعرف (ID اللاعب أو رقم الحساب)';
    } else if (serviceType === 'transfer') {
      if (!recipientName || !shamCashPhone || !amount) return 'جميع الحقول مطلوبة';
    } else if (serviceType === 'crypto') {
      if (!amount || !price) return 'يرجى إدخال المبلغ والسعر';
    } else if (serviceType === 'exchange') {
      if (!amount || !rateExchange) return 'يرجى ملء جميع الحقول';
    }
    return null;
  };

  const getFormData = () => {
    switch (serviceType) {
      case 'gaming':
      case 'apps':
        return { playerId, requiredAmountUSD };
      case 'transfer':
        return { recipientName, shamCashPhone, amount: parseFloat(amount), requiredAmountUSD };
      case 'crypto':
        return { tradeType, amount: parseFloat(amount), price: parseFloat(price), paymentMethod, requiredAmountUSD };
      case 'exchange':
        return { exchangeType, amount: parseFloat(amount), rateExchange: parseFloat(rateExchange), requiredAmountUSD };
      default:
        return {};
    }
  };

  const buildOrderData = (formData) => {
    let orderData = {
      userId: userData.uid,
      customerName: userData.name || '',
      type: serviceType,
      status: 'completed',
      paidByBalance: true,
      createdAt: serverTimestamp(),
    };

    switch (serviceType) {
      case 'gaming':
      case 'apps':
        orderData = {
          ...orderData,
          itemId: item.id,
          itemName: item.name,
          packageId: pkg.id,
          packageName: pkg.name,
          priceUSD: requiredAmountUSD,
          finalPriceUSD: requiredAmountUSD,
          exchangeRateAtPurchase: rate || null,
          currencyUsed: currency,
          playerId: formData.playerId,
          discountApplied: computedDiscount, // تسجيل نسبة الخصم المطبقة
        };
        break;
      case 'transfer':
        orderData = {
          ...orderData,
          recipientName: formData.recipientName,
          shamCashPhone: formData.shamCashPhone,
          amount: formData.amount,
        };
        break;
      case 'crypto':
        orderData = {
          ...orderData,
          tradeType: formData.tradeType,
          amount: formData.amount,
          price: formData.price,
          paymentMethod: formData.paymentMethod,
        };
        break;
      case 'exchange':
        orderData = {
          ...orderData,
          exchangeType: formData.exchangeType,
          amount: formData.amount,
          rate: formData.rateExchange,
        };
        break;
    }
    return orderData;
  };

  const sendNotifications = async (orderId, formData) => {
    let orderMessageData = {};
    switch (serviceType) {
      case 'gaming':
      case 'apps':
        orderMessageData = {
          itemName: item.name,
          packageName: pkg.name,
          playerId: formData.playerId,
          finalPriceUSD: formData.requiredAmountUSD,
          currencyUsed: currency,
          customerName: userData.name || '',
        };
        break;
      case 'transfer':
        orderMessageData = { recipientName: formData.recipientName, shamCashPhone: formData.shamCashPhone, amount: formData.amount, customerName: userData.name || '' };
        break;
      case 'crypto':
        orderMessageData = { tradeType: formData.tradeType, amount: formData.amount, price: formData.price, customerName: userData.name || '' };
        break;
      case 'exchange':
        orderMessageData = { exchangeType: formData.exchangeType, amount: formData.amount, rate: formData.rateExchange, customerName: userData.name || '' };
        break;
    }
    const message = formatOrderMessage(orderMessageData, orderId, serviceType);
    await sendWhatsAppNotification(null, message, null);
    await addNotification(
      userData.uid,
      '✅ طلب مكتمل',
      `طلب #${orderId.slice(-6)} - تم خصم ${formData.requiredAmountUSD.toFixed(2)} $ من رصيدك`,
      'order_completed',
      orderId,
      '/my-orders'
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');

    const validationError = validateForm();
    if (validationError) return setError(validationError);

    if (balance < requiredAmountUSD) {
      return setError(`رصيدك غير كافٍ. المطلوب: ${requiredAmountUSD.toFixed(2)} $، رصيدك: ${balance.toFixed(2)} $`);
    }

    setLoading(true);
    try {
      const deducted = await deductBalance(requiredAmountUSD);
      if (!deducted) throw new Error('فشل خصم الرصيد');

      const formData = getFormData();
      const orderData = buildOrderData(formData);
      const docRef = await addDoc(collection(db, 'orders'), orderData);

      await sendNotifications(docRef.id, formData);

      showToast(`✅ تم تنفيذ طلبك بنجاح! تم خصم ${requiredAmountUSD.toFixed(2)} $ من رصيدك.`, 'success', 4000);

      // إعادة تعيين الحقول
      if (serviceType === 'gaming' || serviceType === 'apps') setPlayerId('');
      if (serviceType === 'transfer') { setRecipientName(''); setShamCashPhone(''); setAmount(''); }
      if (serviceType === 'crypto') { setAmount(''); setPrice(''); }
      if (serviceType === 'exchange') { setAmount(''); setRateExchange(''); }

      setTimeout(() => navigate(redirectPath || '/dashboard'), 3000);
    } catch (err) {
      console.error(err);
      showToast('❌ حدث خطأ أثناء معالجة الطلب: ' + err.message, 'error', 5000);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => {
    switch (serviceType) {
      case 'gaming':
      case 'apps':
        return <GamingAppsForm playerId={playerId} setPlayerId={setPlayerId} displayPrice={displayPrice} pkg={pkg} balance={balance} />;
      case 'transfer':
        // return <TransferForm ... />; سيتم تفعيلها لاحقاً
        return <p>نموذج التحويل قيد التطوير</p>;
      case 'crypto':
        return <p>نموذج العملات الرقمية قيد التطوير</p>;
      case 'exchange':
        return <p>نموذج الصرافة قيد التطوير</p>;
      default:
        return null;
    }
  };

  return (
    <div className="unified-checkout" dir="rtl">
      <div style={{ marginBottom: '1rem' }}>
        <GoBackButton text="رجوع" />
      </div>
      <h2 className="unified-checkout__title">إتمام عملية الشراء</h2>
      <div className="unified-checkout__form">
        <h3>
          {serviceType === 'gaming' && 'طلب شحن ألعاب'}
          {serviceType === 'apps' && 'طلب شحن تطبيقات'}
          {serviceType === 'transfer' && 'طلب تحويل شام كاش'}
          {serviceType === 'crypto' && 'طلب عملات رقمية'}
          {serviceType === 'exchange' && 'طلب صرافة شام كاش'}
          {needsItemAndPackage && item && pkg && `: ${item.name} - ${pkg.name}`}
        </h3>
        <form onSubmit={handleSubmit}>
          <Suspense fallback={<Loading text="جاري تحميل النموذج..." />}>
            {renderForm()}
          </Suspense>

          <Button type="submit" disabled={loading || balance < requiredAmountUSD}>
            {loading ? 'جاري التنفيذ...' : `تأكيد الطلب (${requiredAmountUSD.toFixed(2)} $)`}
          </Button>

          {error && <p className="unified-checkout__error">❌ {error}</p>}
        </form>
      </div>
    </div>
  );
}