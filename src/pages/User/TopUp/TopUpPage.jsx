// // src/pages/User/TopUp/TopUpPage.jsx
// import { useState } from 'react';
// import { useAuth } from '../../../context/AuthContext';
// import { useBalance } from '../../../context/BalanceContext';
// import { useTopUpSettings } from '../../../context/TopUpSettingsContext';
// import { useCurrency } from '../../../context/CurrencyContext';
// import { useExchangeRate } from '../../../context/ExchangeRateContext';
// import { useNotifications } from '../../../context/NotificationContext';
// import { db } from '../../../firebase';
// import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
// import GoBackButton from '../../../components/GeneralComponents/GoBackButton/GoBackButton';
// import Button from '../../../components/GeneralComponents/Button/Button';
// import Input from '../../../components/GeneralComponents/Input/Input';
// import ImageUpload from '../../../components/GeneralComponents/ImageUpload/ImageUpload';
// import { showToast } from '../../../components/GeneralComponents/ToastNotification/ToastNotification';
// // ✅ استيراد دوال إشعارات التلغرام الخاصة بالإيداع
// import { sendTelegramDepositPhoto, formatDepositMessage } from '../../../utils/depositBot';
// import './TopUpPage.css';

// export default function TopUpPage() {
//   const { userData } = useAuth();
//   const { balance, loading: balanceLoading } = useBalance();
//   const { settings, loading: settingsLoading } = useTopUpSettings();
//   const { currency } = useCurrency();
//   const { rate } = useExchangeRate();
//   const { addNotification } = useNotifications();
//   const [selectedMethod, setSelectedMethod] = useState('usdt');
//   const [amount, setAmount] = useState('');
//   const [transactionNumber, setTransactionNumber] = useState('');
//   const [senderName, setSenderName] = useState('');
//   const [receiptImage, setReceiptImage] = useState('');
//   const [loading, setLoading] = useState(false);

//   if (settingsLoading) return <div>جاري تحميل طرق الدفع...</div>;

//   if (!settings) {
//     const whatsapp = '963939454690';
//     return (
//       <div className="topup-page" dir="rtl">
//         <div className="topup-page__header">
//           <GoBackButton text="رجوع" />
//           <h2>شحن الرصيد</h2>
//         </div>
//         <div className="current-balance-card">
//           <div className="balance-label">رصيدك الحالي</div>
//           <div className="balance-amount">
//             {balanceLoading ? 'جاري التحميل...' : `${balance.toFixed(2)} $`}
//           </div>
//         </div>
//         <div className="maintenance-message">
//           <div className="maintenance-icon">🚧</div>
//           <h3>خدمة شحن الرصيد في صيانة</h3>
//           <p>🚧 لم يتم إعداد معلومات التحويل بعد من قبل المدير. يرجى المحاولة لاحقاً.</p>
//           <p>يمكنك التواصل مع الدعم الفني للمساعدة:</p>
//           <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="whatsapp-support-btn">
//             📱 تواصل عبر واتساب
//           </a>
//         </div>
//       </div>
//     );
//   }

//   const minDepositUSD = settings.minDeposit || 3;
//   const minDepositSYP = rate ? Math.ceil(minDepositUSD * rate) : null;

//   const getMinDepositDisplay = () => {
//     if (currency === 'USD') {
//       return `${minDepositUSD} $`;
//     } else {
//       return minDepositSYP ? `${minDepositSYP.toLocaleString()} ل.س` : `${minDepositUSD} $ (سعر الصرف غير متاح)`;
//     }
//   };

//   const isAmountValid = () => {
//     if (!amount) return false;
//     const numAmount = parseFloat(amount);
//     if (isNaN(numAmount)) return false;
//     return numAmount >= minDepositUSD;
//   };
//   const amountIsInvalid = amount !== '' && !isAmountValid();

//   const isPaymentInfoComplete = () => {
//     const method = settings[selectedMethod];
//     if (!method) return false;
//     if (selectedMethod === 'usdt') {
//       return method.address && method.address.trim() !== '';
//     } else {
//       return method.accountNumber && method.accountNumber.trim() !== '';
//     }
//   };

//   const methods = [
//     { id: 'usdt', name: 'USDT (تيثر)', icon: '₿', enabled: settings.usdt?.enabled },
//     { id: 'shamCash', name: 'شام كاش', icon: '🏦', enabled: settings.shamCash?.enabled },
//     { id: 'siretelCash', name: 'سيريتل كاش', icon: '📱', enabled: settings.siretelCash?.enabled },
//   ].filter(m => m.enabled);

//   const currentMethod = settings[selectedMethod];
//   const supportWhatsApp = settings.supportWhatsApp || '963939454690';

//   const isMaintenance = !isPaymentInfoComplete();
//   const maintenanceMessage = !currentMethod?.address && !currentMethod?.accountNumber
//     ? '🚧 عذراً، خدمة شحن الرصيد غير متاحة حالياً بسبب تحديث معلومات التحويل. يرجى المحاولة لاحقاً.'
//     : '🚧 معلومات التحويل لهذه الطريقة غير مكتملة، يرجى تجربة طريقة دفع أخرى أو الاتصال بالدعم.';

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (isMaintenance) {
//       return showToast('خدمة شحن الرصيد في صيانة حالياً، يرجى المحاولة لاحقاً', 'error');
//     }
//     if (!amount || parseFloat(amount) < minDepositUSD) {
//       return showToast(`الحد الأدنى للإيداع هو ${getMinDepositDisplay()}`, 'error');
//     }
//     if (!transactionNumber) return showToast('يرجى إدخال رقم العملية', 'error');
//     if (!senderName) return showToast('يرجى إدخال اسم المرسل', 'error');
//     if (!receiptImage) return showToast('يرجى رفع إيصال الدفع', 'error');

//     setLoading(true);
//     try {
//       const docRef = await addDoc(collection(db, 'topUpRequests'), {
//         userId: userData.uid,
//         userName: userData.name,
//         amount: parseFloat(amount),
//         paymentMethod: selectedMethod,
//         transactionNumber,
//         senderName,
//         receiptImage,
//         status: 'pending',
//         createdAt: serverTimestamp(),
//       });

//       await addNotification(
//         userData.uid,
//         '💰 طلب شحن رصيد',
//         `تم تقديم طلب شحن بقيمة ${amount} $ بنجاح. رقم الطلب: #${docRef.id.slice(-6)} سيتم مراجعته قريباً.`,
//         'order_created',
//         docRef.id,
//         '/profile'
//       );

//       // ✅ إرسال إشعار إلى بوت التلغرام الخاص بالإيداعات (مع الصورة)
//       try {
//         const depositMessage = formatDepositMessage(
//           {
//             amount: parseFloat(amount),
//             userName: userData.name,
//             paymentMethod: selectedMethod,
//             transactionNumber: transactionNumber,
//           },
//           docRef.id
//         );
//         await sendTelegramDepositPhoto(depositMessage, receiptImage);
//         console.log('✅ تم إرسال إشعار الإيداع إلى التلغرام');
//       } catch (telegramErr) {
//         console.error('❌ فشل إرسال إشعار التلغرام:', telegramErr);
//         // لا نوقف العملية إذا فشل التلغرام
//       }

//       showToast('✅ تم إرسال طلب الشحن، سيتم مراجعته قريباً', 'success');
//       setAmount('');
//       setTransactionNumber('');
//       setSenderName('');
//       setReceiptImage('');
//     } catch (error) {
//       console.error(error);
//       showToast('فشل إرسال الطلب', 'error');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="topup-page" dir="rtl">
//       <div className="topup-page__header">
//         <GoBackButton text="رجوع" />
//         <h2>شحن الرصيد</h2>
//       </div>

//       <div className="current-balance-card">
//         <div className="balance-label">رصيدك الحالي</div>
//         <div className="balance-amount">
//           {balanceLoading ? 'جاري التحميل...' : `${balance.toFixed(2)} $`}
//         </div>
//       </div>

//       {isMaintenance ? (
//         <div className="maintenance-message">
//           <div className="maintenance-icon">🚧</div>
//           <h3>قيد الصيانة</h3>
//           <p>{maintenanceMessage}</p>
//           <p>يمكنك التواصل مع الدعم الفني للمساعدة:</p>
//           <a href={`https://wa.me/${supportWhatsApp}`} target="_blank" rel="noopener noreferrer" className="whatsapp-support-btn">
//             📱 تواصل عبر واتساب
//           </a>
//         </div>
//       ) : (
//         <>
//           <div className="topup-page__beneficiary">
//             <h3>معلومات التحويل</h3>
//             <div className="beneficiary-methods">
//               {methods.map(method => (
//                 <button
//                   key={method.id}
//                   className={`method-tab ${selectedMethod === method.id ? 'active' : ''}`}
//                   onClick={() => setSelectedMethod(method.id)}
//                 >
//                   <span className="method-icon">{method.icon}</span>
//                   {method.name}
//                 </button>
//               ))}
//             </div>

//             <div className="beneficiary-details">
//               {selectedMethod === 'usdt' && (
//                 <>
//                   <p><strong>🔗 الشبكة:</strong> {currentMethod?.network || 'TRC20'}</p>
//                   <p><strong>🏦 عنوان المحفظة:</strong> <code>{currentMethod?.address || '—'}</code></p>
//                   {currentMethod?.qrCode && (
//                     <div className="qr-code">
//                       <img src={currentMethod.qrCode} alt="QR Code" />
//                     </div>
//                   )}
//                 </>
//               )}
//               {(selectedMethod === 'shamCash' || selectedMethod === 'siretelCash') && (
//                 <>
//                   <p><strong>👤 اسم المستفيد:</strong> {currentMethod?.accountName || '—'}</p>
//                   <p><strong>📞 رقم الحساب/الهاتف:</strong> {currentMethod?.accountNumber || '—'}</p>
//                   {currentMethod?.qrCode && (
//                     <div className="qr-code">
//                       <img src={currentMethod.qrCode} alt="QR Code" />
//                     </div>
//                   )}
//                 </>
//               )}
//             </div>

//             <div className="min-deposit-notice">
//               ⚠️ الحد الأدنى للإيداع: <strong>{getMinDepositDisplay()}</strong>
//             </div>

//             <div className="support-note">
//               <p>📢 للإيداع السريع والتواصل مع الدعم الفني:</p>
//               <a href={`https://wa.me/${supportWhatsApp}`} target="_blank" rel="noopener noreferrer" className="whatsapp-support-btn">
//                 📱 تواصل عبر واتساب للدعم
//               </a>
//             </div>
//           </div>

//           <div className="topup-page__form">
//             <h3>تقديم طلب شحن</h3>
//             <form onSubmit={handleSubmit}>
//               <div className="input-group amount-input-group">
//                 <Input
//                   label="المبلغ (دولار أمريكي)"
//                   type="number"
//                   step="1"
//                   min={minDepositUSD}
//                   value={amount}
//                   onChange={(e) => setAmount(e.target.value)}
//                   required
//                   className={amountIsInvalid ? 'input-error' : ''}
//                 />
//                 {amountIsInvalid && (
//                   <div className="input-error-message">
//                     ⚠️ الحد الأدنى للإيداع هو {getMinDepositDisplay()}
//                   </div>
//                 )}
//               </div>

//               <Input
//                 label="رقم العملية (رقم التحويل المرجعي)"
//                 value={transactionNumber}
//                 onChange={(e) => setTransactionNumber(e.target.value)}
//                 placeholder="مثال: TRC20-123456"
//                 required
//               />
//               <Input
//                 label="اسم المرسل (الاسم الذي أرسل به التحويل)"
//                 value={senderName}
//                 onChange={(e) => setSenderName(e.target.value)}
//                 required
//               />
//               <ImageUpload
//                 label="إيصال الدفع (صورة)"
//                 onUploadComplete={setReceiptImage}
//                 maxSizeMB={0.5}
//                 disabled={loading}
//               />
//               <Button type="submit" disabled={loading}>
//                 {loading ? 'جاري الإرسال...' : 'تقديم طلب ايداع'}
//               </Button>
//             </form>
//           </div>
//         </>
//       )}
//     </div>
//   );
// }
// src/pages/User/TopUp/TopUpPage.jsx
import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useBalance } from '../../../context/BalanceContext';
import { useTopUpSettings } from '../../../context/TopUpSettingsContext';
import { useCurrency } from '../../../context/CurrencyContext';
import { useExchangeRate } from '../../../context/ExchangeRateContext';
import { useNotifications } from '../../../context/NotificationContext';
import { db } from '../../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import GoBackButton from '../../../components/GeneralComponents/GoBackButton/GoBackButton';
import { showToast } from '../../../components/GeneralComponents/ToastNotification/ToastNotification';
import { sendTelegramDepositPhoto, formatDepositMessage } from '../../../utils/depositBot';
import { useTopUpValidation } from '../../../hooks/useTopUpValidation';
import WhatsappWarning from '../../../components/UserComponents/TopUp/WhatsappWarning/WhatsappWarning';
import MaintenanceMessage from '../../../components/UserComponents/TopUp/MaintenanceMessage/MaintenanceMessage';
import TopUpMethods from '../../../components/UserComponents/TopUp/TopUpMethods/TopUpMethods';
import TopUpForm from '../../../components/UserComponents/TopUp/TopUpForm/TopUpForm';
import './TopUpPage.css';

export default function TopUpPage() {
  const { userData } = useAuth();
  const { balance, loading: balanceLoading } = useBalance();
  const { settings, loading: settingsLoading } = useTopUpSettings();
  const { currency } = useCurrency();
  const { rate } = useExchangeRate();
  const { addNotification } = useNotifications();

  const [selectedMethod, setSelectedMethod] = useState('usdt');
  const [amount, setAmount] = useState('');
  const [transactionNumber, setTransactionNumber] = useState('');
  const [senderName, setSenderName] = useState('');
  const [receiptImage, setReceiptImage] = useState('');
  const [loading, setLoading] = useState(false);

  const hasWhatsapp = !!userData?.whatsappNumber?.trim();
  const {
    minDepositUSD,
    getMinDepositDisplay,
    amountIsInvalid,
    isMaintenance,
  } = useTopUpValidation(settings, amount, selectedMethod, currency, rate);

  if (settingsLoading) return <div>جاري تحميل طرق الدفع...</div>;

  // حالة عدم وجود إعدادات
  if (!settings) {
    return (
      <div className="topup-page" dir="rtl">
        <div className="topup-page__header">
          <GoBackButton text="رجوع" />
          <h2>شحن الرصيد</h2>
        </div>
        <div className="current-balance-card">
          <div className="balance-label">رصيدك الحالي</div>
          <div className="balance-amount">
            {balanceLoading ? 'جاري التحميل...' : `${balance.toFixed(2)} $`}
          </div>
        </div>
        <MaintenanceMessage
          message="🚧 لم يتم إعداد معلومات التحويل بعد من قبل المدير. يرجى المحاولة لاحقاً."
          supportWhatsApp="963939454690"
        />
      </div>
    );
  }

  const methods = [
    { id: 'usdt', name: 'USDT (تيثر)', icon: '₿', enabled: settings.usdt?.enabled },
    { id: 'shamCash', name: 'شام كاش', icon: '🏦', enabled: settings.shamCash?.enabled },
    { id: 'siretelCash', name: 'سيريتل كاش', icon: '📱', enabled: settings.siretelCash?.enabled },
  ].filter(m => m.enabled);

  const currentMethod = settings[selectedMethod];
  const supportWhatsApp = settings.supportWhatsApp || '963939454690';
  const maintenanceMessage = !currentMethod?.address && !currentMethod?.accountNumber
    ? '🚧 عذراً، خدمة شحن الرصيد غير متاحة حالياً بسبب تحديث معلومات التحويل. يرجى المحاولة لاحقاً.'
    : '🚧 معلومات التحويل لهذه الطريقة غير مكتملة، يرجى تجربة طريقة دفع أخرى أو الاتصال بالدعم.';

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!hasWhatsapp) {
      showToast('⚠️ يرجى إضافة رقم واتساب في ملفك الشخصي أولاً', 'error', 5000);
      return;
    }
    if (isMaintenance) {
      return showToast('خدمة شحن الرصيد في صيانة حالياً، يرجى المحاولة لاحقاً', 'error');
    }
    if (!amount || parseFloat(amount) < minDepositUSD) {
      return showToast(`الحد الأدنى للإيداع هو ${getMinDepositDisplay()}`, 'error');
    }
    if (!transactionNumber) return showToast('يرجى إدخال رقم العملية', 'error');
    if (!senderName) return showToast('يرجى إدخال اسم المرسل', 'error');
    if (!receiptImage) return showToast('يرجى رفع إيصال الدفع', 'error');

    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, 'topUpRequests'), {
        userId: userData.uid,
        userName: userData.name,
        amount: parseFloat(amount),
        paymentMethod: selectedMethod,
        transactionNumber,
        senderName,
        receiptImage,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      await addNotification(
        userData.uid,
        '💰 طلب شحن رصيد',
        `تم تقديم طلب شحن بقيمة ${amount} $ بنجاح. رقم الطلب: #${docRef.id.slice(-6)} سيتم مراجعته قريباً.`,
        'order_created',
        docRef.id,
        '/profile'
      );

      try {
        const depositMessage = formatDepositMessage(
          {
            amount: parseFloat(amount),
            userName: userData.name,
            paymentMethod: selectedMethod,
            transactionNumber,
          },
          docRef.id
        );
        await sendTelegramDepositPhoto(depositMessage, receiptImage);
      } catch (telegramErr) {
        console.error('❌ فشل إرسال إشعار التلغرام:', telegramErr);
      }

      showToast('✅ تم إرسال طلب الشحن، سيتم مراجعته قريباً', 'success');
      setAmount('');
      setTransactionNumber('');
      setSenderName('');
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

      <div className="current-balance-card">
        <div className="balance-label">رصيدك الحالي</div>
        <div className="balance-amount">
          {balanceLoading ? 'جاري التحميل...' : `${balance.toFixed(2)} $`}
        </div>
      </div>

      {!hasWhatsapp && <WhatsappWarning />}

      {isMaintenance ? (
        <MaintenanceMessage message={maintenanceMessage} supportWhatsApp={supportWhatsApp} />
      ) : (
        <>
          <TopUpMethods
            methods={methods}
            selectedMethod={selectedMethod}
            onSelectMethod={setSelectedMethod}
            currentMethod={currentMethod}
          />

          <div className="min-deposit-notice">
            ⚠️ الحد الأدنى للإيداع: <strong>{getMinDepositDisplay()}</strong>
          </div>

          <div className="support-note">
            <p>📢 للإيداع السريع والتواصل مع الدعم الفني:</p>
            <a href={`https://wa.me/${supportWhatsApp}`} target="_blank" rel="noopener noreferrer" className="whatsapp-support-btn">
              📱 تواصل عبر واتساب للدعم
            </a>
          </div>

          <TopUpForm
            amount={amount}
            setAmount={setAmount}
            amountIsInvalid={amountIsInvalid}
            getMinDepositDisplay={getMinDepositDisplay}
            transactionNumber={transactionNumber}
            setTransactionNumber={setTransactionNumber}
            senderName={senderName}
            setSenderName={setSenderName}
            receiptImage={receiptImage}
            setReceiptImage={setReceiptImage}
            loading={loading}
            onSubmit={handleSubmit}
          />
        </>
      )}
    </div>
  );
}