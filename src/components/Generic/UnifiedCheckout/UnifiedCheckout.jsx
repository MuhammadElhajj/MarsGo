// src/components/Generic/UnifiedCheckout/UnifiedCheckout.jsx
import { useState, lazy, Suspense, useMemo, useCallback } from 'react';
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
import useFinalPrice from '../../../hooks/useFinalPrice';
import { createStoreOrder } from '../../../services/apiStoreService'; // ✅ استدعاء خدمة API المتجر
import './UnifiedCheckout.css';

const GamingAppsForm = lazy(() => import('./forms/GamingAppsForm'));

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
        <GoBackButton text="رجوع" onClick={() => navigate(redirectPath || '/dashboard')} aria-label="رجوع إلى الصفحة السابقة" />
        <p className="unified-checkout__error" role="alert">⚠️ لم يتم تحديد خدمة أو باقة. الرجاء اختيار الخدمة أولاً.</p>
      </div>
    );
  }

  const productType = (serviceType === 'gaming') ? 'game' : (serviceType === 'apps') ? 'app' : null;
  
  // حساب السعر باستخدام useMemo لتجنب إعادة الحساب غير الضروري
  const { priceUSD, packageDiscount } = useMemo(() => {
    if (needsItemAndPackage && pkg) {
      const rawPrice = typeof pkg.price === 'number' ? pkg.price : parseFloat(pkg.price);
      return { priceUSD: rawPrice, packageDiscount: pkg.discount || 0 };
    }
    return { priceUSD: 0, packageDiscount: 0 };
  }, [needsItemAndPackage, pkg]);

  const hookProductId = (needsItemAndPackage && item?.id) ? item.id : null;
  const hookOriginalPrice = (needsItemAndPackage && pkg) ? priceUSD : 0;
  const hookItemDiscount = (needsItemAndPackage && pkg) ? packageDiscount : 0;
  
  const { finalPrice: computedPrice, discountPercent: computedDiscount } = useFinalPrice(
    productType,
    hookProductId,
    hookOriginalPrice,
    hookItemDiscount
  );

  // حساب requiredAmountUSD و displayPrice باستخدام useMemo
  const { requiredAmountUSD, displayPrice } = useMemo(() => {
    if (needsItemAndPackage && pkg) {
      const amountUSD = computedPrice;
      const priceDisplay = currency === 'USD'
        ? `${amountUSD.toFixed(2)} $`
        : rate ? `${(amountUSD * rate).toFixed(0).toLocaleString()} ل.س` : '...';
      return { requiredAmountUSD: amountUSD, displayPrice: priceDisplay };
    } else if (serviceType === 'transfer') {
      const val = parseFloat(amount) || 0;
      return { requiredAmountUSD: val, displayPrice: `${val} $` };
    } else if (serviceType === 'crypto') {
      const val = parseFloat(price) || 0;
      return { requiredAmountUSD: val, displayPrice: `${val} $` };
    } else if (serviceType === 'exchange') {
      const val = parseFloat(amount) || 0;
      return { requiredAmountUSD: val, displayPrice: `${val} $` };
    }
    return { requiredAmountUSD: 0, displayPrice: '' };
  }, [needsItemAndPackage, pkg, computedPrice, currency, rate, serviceType, amount, price]);

  const validateForm = useCallback(() => {
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
  }, [serviceType, playerId, recipientName, shamCashPhone, amount, price, rateExchange]);

  const getFormData = useCallback(() => {
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
  }, [serviceType, playerId, requiredAmountUSD, recipientName, shamCashPhone, amount, tradeType, price, paymentMethod, exchangeType, rateExchange]);

  const buildOrderData = useCallback((formData, externalResult = null) => {
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
          discountApplied: computedDiscount,
          ...(externalResult && {
            externalOrderId: externalResult.order_id,
            externalStatus: externalResult.status,
            externalPrice: externalResult.price,
            externalData: externalResult.data,
          }),
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
  }, [userData, serviceType, item, pkg, requiredAmountUSD, rate, currency, computedDiscount]);

  const sendNotifications = useCallback(async (orderId, formData) => {
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
  }, [serviceType, item, pkg, currency, userData, addNotification]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (balance < requiredAmountUSD) {
      setError(`رصيدك غير كافٍ. المطلوب: ${requiredAmountUSD.toFixed(2)} $، رصيدك: ${balance.toFixed(2)} $`);
      return;
    }

    setLoading(true);
    try {
      let externalResult = null;

      // ✅ للألعاب والتطبيقات: استدعاء API المتجر أولاً (صاروخ)
      if (serviceType === 'gaming' || serviceType === 'apps') {
        if (!pkg.externalProductId) {
          throw new Error('هذه الباقة غير مرتبطة بمتجر خارجي، يرجى مراجعة الإدارة.');
        }
        const orderUuid = crypto.randomUUID();
        const anyKey = pkg.externalAnyKey || '';
        externalResult = await createStoreOrder({
          productId: pkg.externalProductId,
          quantity: 1,
          playerId,
          anyKey,
          orderUuid,
        });
        // بعد نجاح الطلب الخارجي، نخصم الرصيد
        const deducted = await deductBalance(requiredAmountUSD);
        if (!deducted) throw new Error('فشل خصم الرصيد');
      } else {
        // باقي الخدمات: خصم الرصيد أولاً
        const deducted = await deductBalance(requiredAmountUSD);
        if (!deducted) throw new Error('فشل خصم الرصيد');
      }

      const formData = getFormData();
      const orderData = buildOrderData(formData, externalResult);
      const docRef = await addDoc(collection(db, 'orders'), orderData);

      await sendNotifications(docRef.id, formData);

      showToast(`✅ تم تنفيذ طلبك بنجاح!`, 'success', 3000);

      // إعادة تعيين الحقول
      if (serviceType === 'gaming' || serviceType === 'apps') setPlayerId('');
      if (serviceType === 'transfer') { setRecipientName(''); setShamCashPhone(''); setAmount(''); }
      if (serviceType === 'crypto') { setAmount(''); setPrice(''); }
      if (serviceType === 'exchange') { setAmount(''); setRateExchange(''); }

      setTimeout(() => navigate(redirectPath || '/dashboard'), 1500);
    } catch (err) {
      console.error(err);
      showToast(`❌ فشل الطلب: ${err.message}`, 'error', 5000);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [loading, validateForm, balance, requiredAmountUSD, deductBalance, getFormData, buildOrderData, sendNotifications, serviceType, navigate, redirectPath, playerId, pkg]);

  const renderForm = () => {
    switch (serviceType) {
      case 'gaming':
      case 'apps':
        return <GamingAppsForm playerId={playerId} setPlayerId={setPlayerId} displayPrice={displayPrice} pkg={pkg} balance={balance} />;
      case 'transfer':
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
        <GoBackButton text="رجوع" aria-label="رجوع إلى الصفحة السابقة" />
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

          {error && <p className="unified-checkout__error" role="alert">❌ {error}</p>}
        </form>
      </div>
    </div>
  );
}