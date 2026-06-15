// src/pages/User/TopUp/TopUpPage.jsx
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useAppStore } from '../../../store/store';
import { db } from '../../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import GoBackButton from '../../../components/GeneralComponents/GoBackButton/GoBackButton';
import { showToast } from '../../../components/GeneralComponents/ToastNotification/ToastNotification';
import { sendTelegramDepositMessage, formatDepositMessage } from '../../../utils/depositBot';
import { useTopUpValidation } from '../../../hooks/useTopUpValidation';
import WhatsappWarning from '../../../components/UserComponents/TopUp/WhatsappWarning/WhatsappWarning';
import MaintenanceMessage from '../../../components/UserComponents/TopUp/MaintenanceMessage/MaintenanceMessage';
import TopUpForm from '../../../components/UserComponents/TopUp/TopUpForm/TopUpForm';
import './TopUpPage.css';
import VisaCard from '../../../components/GeneralComponents/VisaCard/VisaCard';

export default function TopUpPage() {
  const { userData } = useAuth();
  const balance = useAppStore((state) => state.balance);
  const currency = useAppStore((state) => state.currency);
  const exchangeRate = useAppStore((state) => state.exchangeRate);
  const topUpSettings = useAppStore((state) => state.topUpSettings);
  const addNotification = useAppStore((state) => state.addNotification);

  const [selectedMethod, setSelectedMethod] = useState(null);
  const [amount, setAmount] = useState('');
  const [transactionNumber, setTransactionNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const hasWhatsapp = !!userData?.whatsappNumber?.trim();

  // بناء قائمة طرق الدفع مع الحساب النشط لكل طريقة
  const methods = useMemo(() => {
    if (!topUpSettings) return [];
    const result = [];
    const methodIds = ['shamCash', 'siretelCash', 'usdt'];
    for (const methodId of methodIds) {
      const methodData = topUpSettings[methodId];
      if (!methodData?.enabled) continue;
      const activeAccount = methodData.accounts?.find(acc => acc.isActive === true);
      if (!activeAccount) continue;
      result.push({
        id: methodId,
        name: methodId === 'shamCash' ? 'شام كاش' : methodId === 'siretelCash' ? 'سيريتل كاش' : 'USDT (تيثر)',
        icon: methodId === 'shamCash' ? '🏦' : methodId === 'siretelCash' ? '📱' : '₿',
        activeAccount: activeAccount,
      });
    }
    return result;
  }, [topUpSettings]);

  // تحديد أول طريقة متاحة كاختيار افتراضي
  useEffect(() => {
    if (methods.length > 0 && !selectedMethod) {
      setSelectedMethod(methods[0].id);
    }
  }, [methods, selectedMethod]);

  // الحصول على الحساب النشط للطريقة المختارة
  const activeAccount = useMemo(() => {
    if (!selectedMethod || !topUpSettings) return null;
    const methodData = topUpSettings[selectedMethod];
    return methodData?.accounts?.find(acc => acc.isActive === true) || null;
  }, [selectedMethod, topUpSettings]);

  const supportWhatsApp = useMemo(() => topUpSettings?.supportWhatsApp || '963939454690', [topUpSettings]);

  const {
    minDepositUSD,
    getMinDepositDisplay,
    amountIsInvalid,
    isMaintenance,
  } = useTopUpValidation(topUpSettings, amount, selectedMethod, currency, exchangeRate);

  const maintenanceMessage = useMemo(() => {
    if (!activeAccount) return 'لا يوجد حساب دفع نشط لهذه الطريقة. يرجى مراجعة الإدارة.';
    if (selectedMethod === 'usdt' && !activeAccount.address) {
      return 'معلومات التحويل (عنوان المحفظة) غير مكتملة، يرجى تجربة طريقة أخرى أو الاتصال بالدعم.';
    }
    if ((selectedMethod === 'shamCash' || selectedMethod === 'siretelCash') && (!activeAccount.accountName || !activeAccount.accountNumber)) {
      return 'معلومات التحويل (اسم المستفيد أو رقم الحساب) غير مكتملة، يرجى تجربة طريقة أخرى أو الاتصال بالدعم.';
    }
    return null;
  }, [activeAccount, selectedMethod]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!hasWhatsapp) {
      showToast('يرجى إضافة رقم واتساب في ملفك الشخصي أولاً', 'error', 5000);
      return;
    }
    if (maintenanceMessage) {
      showToast(maintenanceMessage, 'error');
      return;
    }
    const amountNum = parseFloat(amount);
    if (!amount || amountNum < minDepositUSD) {
      showToast(`الحد الأدنى للإيداع هو ${getMinDepositDisplay()}`, 'error');
      return;
    }
    if (!transactionNumber) {
      showToast('يرجى إدخال رقم العملية', 'error');
      return;
    }

    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, 'topUpRequests'), {
        userId: userData.uid,
        userName: userData.name,
        amount: amountNum,
        paymentMethod: selectedMethod,
        transactionNumber,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      await addNotification({
        id: docRef.id,
        userId: userData.uid,
        title: 'طلب شحن رصيد',
        message: `تم تقديم طلب شحن بقيمة ${amount} $ بنجاح. رقم الطلب: #${docRef.id.slice(-6)} سيتم مراجعته قريباً.`,
        type: 'order_created',
        link: '/profile',
        read: false,
        createdAt: new Date(),
      });

      try {
        const depositMessage = formatDepositMessage(
          {
            amount: amountNum,
            userName: userData.name,
            paymentMethod: selectedMethod,
            transactionNumber,
          },
          docRef.id
        );
        await sendTelegramDepositMessage(depositMessage, docRef.id);
      } catch (telegramErr) {
        console.error('فشل إرسال إشعار التلغرام:', telegramErr);
      }

      showToast('تم إرسال طلب الشحن، سيتم مراجعته قريباً', 'success');
      setAmount('');
      setTransactionNumber('');
    } catch (error) {
      console.error(error);
      showToast('فشل إرسال الطلب', 'error');
    } finally {
      setLoading(false);
    }
  }, [hasWhatsapp, maintenanceMessage, amount, minDepositUSD, getMinDepositDisplay, transactionNumber, userData, selectedMethod, addNotification]);

  if (!topUpSettings) {
    return (
      <div className="topup-page" dir="rtl">
        <div className="topup-page__header">
          <GoBackButton text="رجوع" />
          <h2>شحن الرصيد</h2>
        </div>
       <VisaCard 
  balance={balance} 
  cardHolderName={userData?.name || 'MarsGo User'}
  cardNumber="8888 8888 8888 8888"
  brand="MarsGo Visa"
/>
        <MaintenanceMessage message="جاري تحميل إعدادات الدفع..." supportWhatsApp="963939454690" />
      </div>
    );
  }

  if (methods.length === 0) {
    return (
      <div className="topup-page" dir="rtl">
        <div className="topup-page__header">
          <GoBackButton text="رجوع" />
          <h2>شحن الرصيد</h2>
        </div>
       <VisaCard 
  balance={balance} 
  cardHolderName={userData?.name || 'MarsGo User'}
  cardNumber="8888 8888 8888 8888"
  brand="MarsGo Visa"
/>
        <MaintenanceMessage message="لا توجد طرق دفع مفعلة حالياً، يرجى مراجعة الإدارة." supportWhatsApp={supportWhatsApp} />
      </div>
    );
  }

  return (
    <div className="topup-page" dir="rtl">
      <div className="topup-page__header">
        <GoBackButton text="رجوع" />
        <h2>شحن الرصيد</h2>
      </div>

      {/* بطاقة الرصيد بتصميم فيزا */}
  <VisaCard 
  balance={balance} 
  cardHolderName={userData?.name || 'MarsGo User'}
  cardNumber="8888 8888 8888 8888"
  brand="MarsGo Visa"
/>
      {!hasWhatsapp && <WhatsappWarning />}

      {/* شبكة بطاقات طرق الدفع */}
      <div className="payment-methods-grid">
        {methods.map(method => (
          <div
            key={method.id}
            className={`payment-card ${selectedMethod === method.id ? 'payment-card--active' : ''}`}
            onClick={() => setSelectedMethod(method.id)}
          >
            <div className="payment-card__logo">
              {method.activeAccount?.logoImage ? (
                <img src={method.activeAccount.logoImage} alt={method.name} loading="lazy" />
              ) : (
                <span className="payment-card__emoji">{method.icon}</span>
              )}
            </div>
            <div className="payment-card__name">{method.name}</div>
            {selectedMethod === method.id && (
              <div className="payment-card__check">✓</div>
            )}
          </div>
        ))}
      </div>

      {/* تفاصيل طريقة الدفع المختارة (مع أزرار نسخ) */}
      {selectedMethod && activeAccount && (
        <div className="selected-method-details">
          <h3>تفاصيل التحويل عبر {methods.find(m => m.id === selectedMethod)?.name}</h3>
          <div className="details-grid">
            {selectedMethod === 'usdt' && activeAccount.address && (
              <div className="detail-item">
                <span className="detail-label">عنوان المحفظة:</span>
                <div className="detail-value-with-copy">
                  <code className="detail-value">{activeAccount.address}</code>
                  <button
                    className="copy-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(activeAccount.address);
                      showToast('تم نسخ العنوان', 'success', 1500);
                    }}
                    title="نسخ"
                  >
                    📋
                  </button>
                </div>
              </div>
            )}
            {selectedMethod === 'usdt' && activeAccount.network && (
              <div className="detail-item">
                <span className="detail-label">الشبكة:</span>
                <span className="detail-value">{activeAccount.network}</span>
              </div>
            )}
            {(selectedMethod === 'shamCash' || selectedMethod === 'siretelCash') && activeAccount.accountName && (
              <div className="detail-item">
                <span className="detail-label">اسم المستفيد:</span>
                <span className="detail-value">{activeAccount.accountName}</span>
              </div>
            )}
            {(selectedMethod === 'shamCash' || selectedMethod === 'siretelCash') && activeAccount.accountNumber && (
              <div className="detail-item">
                <span className="detail-label">رقم الحساب/الهاتف:</span>
                <div className="detail-value-with-copy">
                  <code className="detail-value">{activeAccount.accountNumber}</code>
                  <button
                    className="copy-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(activeAccount.accountNumber);
                      showToast('تم نسخ رقم الحساب', 'success', 1500);
                    }}
                    title="نسخ"
                  >
                    📋
                  </button>
                </div>
              </div>
            )}
          </div>
          {activeAccount.qrCode && (
            <div className="qr-section">
              <img src={activeAccount.qrCode} alt="رمز QR" className="qr-image" loading="lazy" />
              <button
                className="download-qr-btn"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = activeAccount.qrCode;
                  link.download = `qr_${selectedMethod}.png`;
                  link.click();
                }}
              >
                تحميل رمز QR
              </button>
            </div>
          )}
          <div className="min-deposit-notice">
            ⚠️ الحد الأدنى للإيداع: <strong>{getMinDepositDisplay()}</strong>
          </div>
        </div>
      )}

      <div className="support-note">
        <p>للإيداع السريع والتواصل مع الدعم الفني:</p>
        <a href={`https://wa.me/${supportWhatsApp}`} target="_blank" rel="noopener noreferrer" className="whatsapp-support-btn">
          تواصل عبر واتساب للدعم
        </a>
      </div>

      <TopUpForm
        amount={amount}
        setAmount={setAmount}
        amountIsInvalid={amountIsInvalid}
        getMinDepositDisplay={getMinDepositDisplay}
        transactionNumber={transactionNumber}
        setTransactionNumber={setTransactionNumber}
        loading={loading}
        onSubmit={handleSubmit}
      />
    </div>
  );
}