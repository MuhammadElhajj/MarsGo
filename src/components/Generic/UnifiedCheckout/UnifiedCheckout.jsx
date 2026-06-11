import { useState, lazy, Suspense, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useAppStore } from '../../../store/store';
import { db } from '../../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import Button from '../../GeneralComponents/Button/Button';
import GoBackButton from '../../GeneralComponents/GoBackButton/GoBackButton';
import { showToast } from '../../GeneralComponents/ToastNotification/ToastNotification';
import { sendWhatsAppNotification, formatOrderMessage } from '../../../utils/sendWhatsAppNotification';
import Loading from '../../GeneralComponents/Loading/Loading';
import useFinalPrice from '../../../hooks/useFinalPrice';
import { createStoreOrder } from '../../../services/apiStoreService';
import './UnifiedCheckout.css';

const GamingAppsForm = lazy(() => import('./forms/GamingAppsForm'));

export default function UnifiedCheckout({ serviceType, redirectPath }) {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { item, package: pkg } = location.state || {};

  // استخدام الـ store المركزي
  const balance = useAppStore((state) => state.balance);
  const deductBalance = useAppStore((state) => state.deductBalance);
  const addNotification = useAppStore((state) => state.addNotification);
  const currency = useAppStore((state) => state.currency);
  const exchangeRate = useAppStore((state) => state.exchangeRate);

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

  const productType = (serviceType === 'gaming') ? 'game' : (serviceType === 'apps') ? 'app' : null;
  
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

  const { requiredAmountUSD, displayPrice } = useMemo(() => {
    if (needsItemAndPackage && pkg) {
      const amountUSD = computedPrice;
      const priceDisplay = currency === 'USD'
        ? `${amountUSD.toFixed(2)} $`
        : exchangeRate ? `${(amountUSD * exchangeRate).toFixed(0).toLocaleString()} ل.س` : '...';
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
  }, [needsItemAndPackage, pkg, computedPrice, currency, exchangeRate, serviceType, amount, price]);

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
          exchangeRateAtPurchase: exchangeRate || null,
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
        orderData = { ...orderData, recipientName: formData.recipientName, shamCashPhone: formData.shamCashPhone, amount: formData.amount };
        break;
      case 'crypto':
        orderData = { ...orderData, tradeType: formData.tradeType, amount: formData.amount, price: formData.price, paymentMethod: formData.paymentMethod };
        break;
      case 'exchange':
        orderData = { ...orderData, exchangeType: formData.exchangeType, amount: formData.amount, rate: formData.rateExchange };
        break;
    }
    return orderData;
  }, [userData, serviceType, item, pkg, requiredAmountUSD, exchangeRate, currency, computedDiscount]);

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
    // إضافة إشعار داخلي (تنسيق جديد يناسب الـ store)
    addNotification({
      id: orderId,
      userId: userData.uid,
      title: '✅ طلب مكتمل',
      message: `طلب #${orderId.slice(-6)} - تم خصم ${formData.requiredAmountUSD.toFixed(2)} $ من رصيدك`,
      type: 'order_completed',
      link: '/my-orders',
      read: false,
      createdAt: new Date(),
    });
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

      if (serviceType === 'gaming' || serviceType === 'apps') {
        if (!pkg.externalProductId) {
          throw new Error('هذه الباقة غير مرتبطة بمتجر خارجي، يرجى مراجعة الإدارة.');
        }
        // دعم randomUUID مع fallback للمتصفحات القديمة
        const orderUuid = (typeof crypto.randomUUID === 'function')
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const anyKey = pkg.externalAnyKey || '';
        externalResult = await createStoreOrder({
          productId: pkg.externalProductId,
          quantity: 1,
          playerId,
          anyKey,
          orderUuid,
        });
        const deducted = await deductBalance(requiredAmountUSD);
        if (!deducted) throw new Error('فشل خصم الرصيد');
      } else {
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
      default:
        return <p>نموذج الخدمة قيد التطوير</p>;
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