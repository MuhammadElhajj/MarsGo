// // src/components/Generic/UnifiedCheckout/UnifiedCheckout.jsx
// import { useState } from 'react';
// import { useNavigate, useLocation } from 'react-router-dom';
// import { useAuth } from '../../../context/AuthContext';
// import { useExchangeRate } from '../../../context/ExchangeRateContext';
// import { useCurrency } from '../../../context/CurrencyContext';
// import { db } from '../../../firebase';
// import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
// import Button from '../../GeneralComponents/Button/Button';
// import Input from '../../GeneralComponents/Input/Input';
// import ImageUpload from '../../GeneralComponents/ImageUpload/ImageUpload';
// import PaymentButton from '../../GeneralComponents/PaymentButton/PaymentButton';
// import GoBackButton from '../../GeneralComponents/GoBackButton/GoBackButton';
// import { showToast } from '../../GeneralComponents/ToastNotification/ToastNotification';
// import { useNotifications } from '../../../context/NotificationContext';
// import { sendWhatsAppNotification, formatOrderMessage } from '../../../utils/sendWhatsAppNotification';
// import './UnifiedCheckout.css';

// export default function UnifiedCheckout({ serviceType, redirectPath }) {
//   const { userData } = useAuth();
//   const { rate } = useExchangeRate();
//   const { currency } = useCurrency();
//   const { addNotification } = useNotifications();
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { item, package: pkg } = location.state || {};

//   // حالة عامة
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');

//   // حقول مشتركة
//   const [receiptImageBase64, setReceiptImageBase64] = useState('');
//   const [idImageBase64, setIdImageBase64] = useState('');

//   // حقول خاصة بكل خدمة
//   const [playerId, setPlayerId] = useState('');
//   const [recipientName, setRecipientName] = useState('');
//   const [shamCashPhone, setShamCashPhone] = useState('');
//   const [amount, setAmount] = useState('');
//   const [tradeType, setTradeType] = useState('buy');
//   const [price, setPrice] = useState('');
//   const [paymentMethod, setPaymentMethod] = useState('شام كاش');
//   const [exchangeType, setExchangeType] = useState('buy_dollar');
//   const [rateExchange, setRateExchange] = useState('');

//   // التحقق من وجود بيانات مطلوبة لـ gaming/apps
//   const needsItemAndPackage = ['gaming', 'apps'].includes(serviceType);
//   if (needsItemAndPackage && (!item || !pkg)) {
//     return (
//       <div className="unified-checkout" dir="rtl">
//         <GoBackButton text="رجوع" onClick={() => navigate(redirectPath || '/dashboard')} />
//         <p className="unified-checkout__error">⚠️ لم يتم تحديد خدمة أو باقة. الرجاء اختيار الخدمة أولاً.</p>
//       </div>
//     );
//   }

//   // حساب السعر للألعاب والتطبيقات
//   let priceUSD = null;
//   let finalPriceUSD = null;
//   let displayPrice = '';
//   if (needsItemAndPackage && pkg) {
//     priceUSD = typeof pkg.price === 'number' ? pkg.price : parseFloat(pkg.price);
//     finalPriceUSD = pkg.discount ? priceUSD * (1 - pkg.discount / 100) : priceUSD;
//     displayPrice = currency === 'USD'
//       ? `${finalPriceUSD.toFixed(2)} $`
//       : rate ? `${(finalPriceUSD * rate).toFixed(0).toLocaleString()} ل.س` : '...';
//   }

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (loading) return;
//     setError('');

//     // التحقق من الحقول الإجبارية حسب الخدمة
//     if (serviceType === 'gaming' || serviceType === 'apps') {
//       if (!playerId) return setError('يرجى إدخال المعرف (ID اللاعب أو رقم الحساب)');
//       if (!receiptImageBase64) return setError('يرجى رفع إيصال الدفع');
//     } else if (serviceType === 'transfer') {
//       if (!recipientName || !shamCashPhone || !amount) return setError('جميع الحقول مطلوبة');
//       if (!idImageBase64 || !receiptImageBase64) return setError('صورة الهوية وإيصال الدفع مطلوبان');
//     } else if (serviceType === 'crypto') {
//       if (!amount || !price) return setError('يرجى إدخال المبلغ والسعر');
//       if (!receiptImageBase64) return setError('يرجى رفع إيصال الدفع');
//     } else if (serviceType === 'exchange') {
//       if (!amount || !rateExchange) return setError('يرجى ملء جميع الحقول');
//       if (!receiptImageBase64) return setError('يرجى رفع إيصال الدفع');
//     }

//     setLoading(true);
//     try {
//       // بناء بيانات الطلب الأساسية
//       let orderData = {
//         userId: userData.uid,
//         customerName: userData.name || '',
//         type: serviceType,
//         status: 'pending_verification',
//         createdAt: serverTimestamp(),
//         receiptImage: receiptImageBase64,
//       };

//       // إضافة حقول خاصة حسب الخدمة
//       if (serviceType === 'gaming' || serviceType === 'apps') {
//         orderData = {
//           ...orderData,
//           itemId: item.id,
//           itemName: item.name,
//           packageId: pkg.id,
//           packageName: pkg.name,
//           priceUSD: priceUSD,
//           finalPriceUSD: finalPriceUSD,
//           exchangeRateAtPurchase: rate || null,
//           currencyUsed: currency,
//           playerId,
//         };
//       } else if (serviceType === 'transfer') {
//         orderData = {
//           ...orderData,
//           recipientName,
//           shamCashPhone,
//           amount: parseFloat(amount),
//           idImage: idImageBase64,
//         };
//       } else if (serviceType === 'crypto') {
//         orderData = {
//           ...orderData,
//           tradeType,
//           amount: parseFloat(amount),
//           price: parseFloat(price),
//           paymentMethod,
//         };
//       } else if (serviceType === 'exchange') {
//         orderData = {
//           ...orderData,
//           exchangeType,
//           amount: parseFloat(amount),
//           rate: parseFloat(rateExchange),
//         };
//       }

//       const docRef = await addDoc(collection(db, 'orders'), orderData);

//       // إرسال إشعار واتساب
//       let orderMessageData = {};
//       if (serviceType === 'gaming' || serviceType === 'apps') {
//         orderMessageData = {
//           itemName: item.name,
//           packageName: pkg.name,
//           playerId: playerId,
//           finalPriceUSD: finalPriceUSD,
//           currencyUsed: currency,
//           customerName: userData.name || '',
//         };
//       } else if (serviceType === 'transfer') {
//         orderMessageData = {
//           recipientName,
//           shamCashPhone,
//           amount,
//           customerName: userData.name || '',
//         };
//       } else if (serviceType === 'crypto') {
//         orderMessageData = {
//           tradeType,
//           amount,
//           price,
//           customerName: userData.name || '',
//         };
//       } else if (serviceType === 'exchange') {
//         orderMessageData = {
//           exchangeType,
//           amount,
//           rate: rateExchange,
//           customerName: userData.name || '',
//         };
//       }
//       const message = formatOrderMessage(orderMessageData, docRef.id, serviceType);
//       await sendWhatsAppNotification(null, message, receiptImageBase64);

//       // إشعار داخلي للمستخدم
//       await addNotification(
//         userData.uid,
//         '📦 طلب جديد',
//         `طلب #${docRef.id.slice(-6)} - ${serviceType === 'gaming' ? 'شحن ألعاب' : serviceType === 'apps' ? 'تطبيقات' : serviceType === 'transfer' ? 'تحويل' : serviceType === 'crypto' ? 'عملات' : 'صرافة'} قيد المراجعة`,
//         'order_created',
//         docRef.id,
//         '/my-orders'
//       );

//       showToast('✅ تم إرسال طلبك بنجاح! سنقوم بمراجعته قريباً.', 'success', 4000);

//       // إعادة تعيين الحقول حسب الخدمة
//       if (serviceType === 'gaming' || serviceType === 'apps') setPlayerId('');
//       if (serviceType === 'transfer') {
//         setRecipientName('');
//         setShamCashPhone('');
//         setAmount('');
//         setIdImageBase64('');
//       }
//       if (serviceType === 'crypto') {
//         setAmount('');
//         setPrice('');
//       }
//       if (serviceType === 'exchange') {
//         setAmount('');
//         setRateExchange('');
//       }
//       setReceiptImageBase64('');

//       setTimeout(() => navigate(redirectPath || '/dashboard'), 3000);
//     } catch (err) {
//       console.error(err);
//       showToast('❌ حدث خطأ أثناء إرسال الطلب: ' + err.message, 'error', 5000);
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // عرض الحقول حسب نوع الخدمة
//   const renderFields = () => {
//     switch (serviceType) {
//       case 'gaming':
//       case 'apps':
//         return (
//           <>
//             <Input
//               label="المعرف (ID اللاعب / رقم الحساب)"
//               value={playerId}
//               onChange={(e) => setPlayerId(e.target.value)}
//               required
//             />
//             <div className="unified-checkout__price-summary">
//               <span>المبلغ المطلوب:</span>
//               <strong>{displayPrice}</strong>
//               {pkg?.discount > 0 && <small> (بعد خصم {pkg.discount}%)</small>}
//             </div>
//           </>
//         );
//       case 'transfer':
//         return (
//           <>
//             <Input label="الاسم الثلاثي للمستلم" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} required />
//             <Input label="رقم هاتف المستلم في شام كاش" value={shamCashPhone} onChange={(e) => setShamCashPhone(e.target.value)} required />
//             <Input label="المبلغ (دولار/يورو)" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
//             <ImageUpload label="صورة هوية المستلم" onUploadComplete={setIdImageBase64} maxSizeMB={0.5} disabled={loading} />
//           </>
//         );
//       case 'crypto':
//         return (
//           <>
//             <div className="unified-checkout__field">
//               <label>نوع العملية</label>
//               <select value={tradeType} onChange={(e) => setTradeType(e.target.value)}>
//                 <option value="buy">شراء</option>
//                 <option value="sell">بيع</option>
//               </select>
//             </div>
//             <Input label="الكمية (USDT)" type="number" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} required />
//             <Input label="السعر المطلوب (دولار/يورو)" type="number" step="any" value={price} onChange={(e) => setPrice(e.target.value)} required />
//             <Input label="طريقة الدفع" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} required />
//           </>
//         );
//       case 'exchange':
//         return (
//           <>
//             <div className="unified-checkout__field">
//               <label>نوع العملية</label>
//               <select value={exchangeType} onChange={(e) => setExchangeType(e.target.value)}>
//                 <option value="buy_dollar">شراء دولار (أدفع ليرة وأستلم دولار)</option>
//                 <option value="sell_dollar">بيع دولار (أدفع دولار وأستلم ليرة)</option>
//               </select>
//             </div>
//             <Input label="المبلغ" type="number" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} required />
//             <Input label="سعر الصرف المقترح" type="number" step="any" value={rateExchange} onChange={(e) => setRateExchange(e.target.value)} required />
//           </>
//         );
//       default:
//         return null;
//     }
//   };

//   return (
//     <div className="unified-checkout" dir="rtl">
//       <div style={{ marginBottom: '1rem' }}>
//         <GoBackButton text="رجوع" />
//       </div>
//       <h2 className="unified-checkout__title">إتمام عملية الشراء</h2>
//       <div className="unified-checkout__form">
//         <h3>
//           {serviceType === 'gaming' && 'طلب شحن ألعاب'}
//           {serviceType === 'apps' && 'طلب شحن تطبيقات'}
//           {serviceType === 'transfer' && 'طلب تحويل شام كاش'}
//           {serviceType === 'crypto' && 'طلب عملات رقمية'}
//           {serviceType === 'exchange' && 'طلب صرافة شام كاش'}
//           {needsItemAndPackage && item && pkg && `: ${item.name} - ${pkg.name}`}
//         </h3>
//         <form onSubmit={handleSubmit}>
//           {renderFields()}

//           <ImageUpload
//             label="إيصال الدفع"
//             onUploadComplete={setReceiptImageBase64}
//             maxSizeMB={0.5}
//             disabled={loading}
//           />

//           <PaymentButton text="ادفع عبر QR" variant="secondary" />

//           <Button type="submit" disabled={loading || (!receiptImageBase64 && serviceType !== 'crypto')}>
//             {loading ? 'جاري الإرسال...' : 'إرسال الطلب'}
//           </Button>

//           {error && <p className="unified-checkout__error">❌ {error}</p>}
//         </form>
//       </div>
//     </div>
//   );
// }

// src/components/Generic/UnifiedCheckout/UnifiedCheckout.jsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useBalance } from '../../../context/BalanceContext';
import { useExchangeRate } from '../../../context/ExchangeRateContext';
import { useCurrency } from '../../../context/CurrencyContext';
import { db } from '../../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import Button from '../../GeneralComponents/Button/Button';
import Input from '../../GeneralComponents/Input/Input';
import GoBackButton from '../../GeneralComponents/GoBackButton/GoBackButton';
import { showToast } from '../../GeneralComponents/ToastNotification/ToastNotification';
import { useNotifications } from '../../../context/NotificationContext';
import { sendWhatsAppNotification, formatOrderMessage } from '../../../utils/sendWhatsAppNotification';
import './UnifiedCheckout.css';

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

  // حقول خاصة بكل خدمة (بدون رفع الصور)
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

  // حساب المبلغ المطلوب بالدولار (للخصم)
  let requiredAmountUSD = 0;
  let displayPrice = '';

  if (needsItemAndPackage && pkg) {
    const priceUSD = typeof pkg.price === 'number' ? pkg.price : parseFloat(pkg.price);
    requiredAmountUSD = pkg.discount ? priceUSD * (1 - pkg.discount / 100) : priceUSD;
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');

    // التحقق من الحقول الإجبارية حسب الخدمة
    if (serviceType === 'gaming' || serviceType === 'apps') {
      if (!playerId) return setError('يرجى إدخال المعرف (ID اللاعب أو رقم الحساب)');
    } else if (serviceType === 'transfer') {
      if (!recipientName || !shamCashPhone || !amount) return setError('جميع الحقول مطلوبة');
    } else if (serviceType === 'crypto') {
      if (!amount || !price) return setError('يرجى إدخال المبلغ والسعر');
    } else if (serviceType === 'exchange') {
      if (!amount || !rateExchange) return setError('يرجى ملء جميع الحقول');
    }

    // التحقق من كفاية الرصيد
    if (balance < requiredAmountUSD) {
      return setError(`رصيدك غير كافٍ. المطلوب: ${requiredAmountUSD.toFixed(2)} $، رصيدك: ${balance.toFixed(2)} $`);
    }

    setLoading(true);
    try {
      // خصم الرصيد أولاً
      const deducted = await deductBalance(requiredAmountUSD);
      if (!deducted) {
        throw new Error('فشل خصم الرصيد');
      }

      // بناء بيانات الطلب
      let orderData = {
        userId: userData.uid,
        customerName: userData.name || '',
        type: serviceType,
        status: 'completed', // الدفع تم عبر الرصيد، مكتمل فوراً
        paidByBalance: true,
        createdAt: serverTimestamp(),
      };

      if (serviceType === 'gaming' || serviceType === 'apps') {
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
          playerId,
        };
      } else if (serviceType === 'transfer') {
        orderData = {
          ...orderData,
          recipientName,
          shamCashPhone,
          amount: parseFloat(amount),
        };
      } else if (serviceType === 'crypto') {
        orderData = {
          ...orderData,
          tradeType,
          amount: parseFloat(amount),
          price: parseFloat(price),
          paymentMethod,
        };
      } else if (serviceType === 'exchange') {
        orderData = {
          ...orderData,
          exchangeType,
          amount: parseFloat(amount),
          rate: parseFloat(rateExchange),
        };
      }

      const docRef = await addDoc(collection(db, 'orders'), orderData);

      // إشعار واتساب (اختياري)
      let orderMessageData = {};
      if (serviceType === 'gaming' || serviceType === 'apps') {
        orderMessageData = {
          itemName: item.name,
          packageName: pkg.name,
          playerId,
          finalPriceUSD: requiredAmountUSD,
          currencyUsed: currency,
          customerName: userData.name || '',
        };
      } else if (serviceType === 'transfer') {
        orderMessageData = { recipientName, shamCashPhone, amount, customerName: userData.name || '' };
      } else if (serviceType === 'crypto') {
        orderMessageData = { tradeType, amount, price, customerName: userData.name || '' };
      } else if (serviceType === 'exchange') {
        orderMessageData = { exchangeType, amount, rate: rateExchange, customerName: userData.name || '' };
      }
      const message = formatOrderMessage(orderMessageData, docRef.id, serviceType);
      await sendWhatsAppNotification(null, message, null);

      // إشعار داخلي للمستخدم
      await addNotification(
        userData.uid,
        '✅ طلب مكتمل',
        `طلب #${docRef.id.slice(-6)} - تم خصم ${requiredAmountUSD.toFixed(2)} $ من رصيدك`,
        'order_completed',
        docRef.id,
        '/my-orders'
      );

      showToast(`✅ تم تنفيذ طلبك بنجاح! تم خصم ${requiredAmountUSD.toFixed(2)} $ من رصيدك.`, 'success', 4000);

      // إعادة تعيين الحقول
      if (serviceType === 'gaming' || serviceType === 'apps') setPlayerId('');
      if (serviceType === 'transfer') {
        setRecipientName('');
        setShamCashPhone('');
        setAmount('');
      }
      if (serviceType === 'crypto') {
        setAmount('');
        setPrice('');
      }
      if (serviceType === 'exchange') {
        setAmount('');
        setRateExchange('');
      }

      setTimeout(() => navigate(redirectPath || '/dashboard'), 3000);
    } catch (err) {
      console.error(err);
      showToast('❌ حدث خطأ أثناء معالجة الطلب: ' + err.message, 'error', 5000);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderFields = () => {
    switch (serviceType) {
      case 'gaming':
      case 'apps':
        return (
          <>
            <Input
              label="المعرف (ID اللاعب / رقم الحساب)"
              value={playerId}
              onChange={(e) => setPlayerId(e.target.value)}
              required
            />
            <div className="unified-checkout__price-summary">
              <span>المبلغ المطلوب:</span>
              <strong>{displayPrice}</strong>
              {pkg?.discount > 0 && <small> (بعد خصم {pkg.discount}%)</small>}
            </div>
            <div className="unified-checkout__balance-info">
              رصيدك الحالي: <strong>{balance.toFixed(2)} $</strong>
            </div>
          </>
        );
      case 'transfer':
        return (
          <>
            <Input label="الاسم الثلاثي للمستلم" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} required />
            <Input label="رقم هاتف المستلم في شام كاش" value={shamCashPhone} onChange={(e) => setShamCashPhone(e.target.value)} required />
            <Input label="المبلغ (دولار/يورو)" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            <div className="unified-checkout__balance-info">
              رصيدك الحالي: <strong>{balance.toFixed(2)} $</strong>
            </div>
          </>
        );
      case 'crypto':
        return (
          <>
            <div className="unified-checkout__field">
              <label>نوع العملية</label>
              <select value={tradeType} onChange={(e) => setTradeType(e.target.value)}>
                <option value="buy">شراء</option>
                <option value="sell">بيع</option>
              </select>
            </div>
            <Input label="الكمية (USDT)" type="number" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            <Input label="السعر المطلوب (دولار/يورو)" type="number" step="any" value={price} onChange={(e) => setPrice(e.target.value)} required />
            <Input label="طريقة الدفع" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} required />
            <div className="unified-checkout__balance-info">
              رصيدك الحالي: <strong>{balance.toFixed(2)} $</strong>
            </div>
          </>
        );
      case 'exchange':
        return (
          <>
            <div className="unified-checkout__field">
              <label>نوع العملية</label>
              <select value={exchangeType} onChange={(e) => setExchangeType(e.target.value)}>
                <option value="buy_dollar">شراء دولار (أدفع ليرة وأستلم دولار)</option>
                <option value="sell_dollar">بيع دولار (أدفع دولار وأستلم ليرة)</option>
              </select>
            </div>
            <Input label="المبلغ" type="number" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            <Input label="سعر الصرف المقترح" type="number" step="any" value={rateExchange} onChange={(e) => setRateExchange(e.target.value)} required />
            <div className="unified-checkout__balance-info">
              رصيدك الحالي: <strong>{balance.toFixed(2)} $</strong>
            </div>
          </>
        );
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
          {renderFields()}

          <Button type="submit" disabled={loading || balance < requiredAmountUSD}>
            {loading ? 'جاري التنفيذ...' : `تأكيد الطلب (${requiredAmountUSD.toFixed(2)} $)`}
          </Button>

          {error && <p className="unified-checkout__error">❌ {error}</p>}
        </form>
      </div>
    </div>
  );
}