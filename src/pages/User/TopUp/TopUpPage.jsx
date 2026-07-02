// src/pages/User/TopUp/TopUpPage.jsx
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useAppStore } from '../../../store/store';
import { db } from '../../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import GoBackButton from '../../../components/GeneralComponents/GoBackButton/GoBackButton';
import { showToast } from '../../../components/GeneralComponents/ToastNotification/ToastNotification';
import { notifyDeposit , formatDepositMessage} from '../../../services/notificationService';
import { useTopUpValidation } from '../../../hooks/useTopUpValidation';
import WhatsappWarning from '../../../components/UserComponents/TopUp/WhatsappWarning/WhatsappWarning';
import MaintenanceMessage from '../../../components/UserComponents/TopUp/MaintenanceMessage/MaintenanceMessage';
import TopUpForm from '../../../components/UserComponents/TopUp/TopUpForm/TopUpForm';
import './TopUpPage.css';
import VisaCard from '../../../components/GeneralComponents/VisaCard/VisaCard';
import PaymentMethods from '../../../components/UserComponents/PaymentMethods/PaymentMethods';
import { 
  FaCopy, 
  FaQrcode, 
  FaWallet, 
  FaMoneyBillWave, 
  FaPhoneAlt,
  FaCreditCard,
  FaUniversity,
  FaMobileAlt,
  FaCoins
} from 'react-icons/fa';
import { FiRefreshCw } from 'react-icons/fi';

export default function TopUpPage() {
  const { userData } = useAuth();
  const balance = useAppStore((state) => state.balance);
  const mgcBalance = useAppStore((state) => state.mgcBalance);
  const currency = useAppStore((state) => state.currency);
  const exchangeRate = useAppStore((state) => state.exchangeRate);
  const topUpSettings = useAppStore((state) => state.topUpSettings);
  const addNotification = useAppStore((state) => state.addNotification);

  const [selectedMethod, setSelectedMethod] = useState(null);
  const [amount, setAmount] = useState('');
  const [transactionNumber, setTransactionNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);

  const hasWhatsapp = !!userData?.whatsappNumber?.trim();

  // مراقبة تحميل إعدادات الدفع
  useEffect(() => {
    if (topUpSettings !== null) {
      setSettingsLoading(false);
    }
  }, [topUpSettings]);

  // بناء قائمة طرق الدفع مع الحساب النشط
  const methods = useMemo(() => {
    if (!topUpSettings) return [];
    const result = [];
    const methodIds = ['shamCash', 'siretelCash', 'usdt'];
    const icons = {
      shamCash: <FaUniversity />,
      siretelCash: <FaMobileAlt />,
      usdt: <FaCoins />
    };
    const names = {
      shamCash: 'شام كاش',
      siretelCash: 'سيريتل كاش',
      usdt: 'USDT (تيثر)'
    };
    for (const methodId of methodIds) {
      const methodData = topUpSettings[methodId];
      if (!methodData?.enabled) continue;
      const activeAccount = methodData.accounts?.find(acc => acc.isActive === true);
      if (!activeAccount) continue;
      result.push({
        id: methodId,
        name: names[methodId],
        icon: icons[methodId],
        activeAccount,
      });
    }
    return result;
  }, [topUpSettings]);

  // تحديد أول طريقة افتراضية
  useEffect(() => {
    if (methods.length > 0 && !selectedMethod) {
      setSelectedMethod(methods[0].id);
    }
  }, [methods, selectedMethod]);

  // الحساب النشط للطريقة المختارة
  const activeAccount = useMemo(() => {
    if (!selectedMethod || !topUpSettings) return null;
    const methodData = topUpSettings[selectedMethod];
    return methodData?.accounts?.find(acc => acc.isActive === true) || null;
  }, [selectedMethod, topUpSettings]);

  const supportWhatsApp = useMemo(
    () => topUpSettings?.supportWhatsApp || '963939454690',
    [topUpSettings]
  );

  const {
    minDepositUSD,
    getMinDepositDisplay,
    amountIsInvalid,
  } = useTopUpValidation(topUpSettings, amount, selectedMethod, currency, exchangeRate);

  const maintenanceMessage = useMemo(() => {
    if (!activeAccount) return 'لا يوجد حساب دفع نشط لهذه الطريقة. يرجى مراجعة الإدارة.';
    if (selectedMethod === 'usdt' && !activeAccount.address) {
      return 'معلومات التحويل (عنوان المحفظة) غير مكتملة، يرجى تجربة طريقة أخرى أو الاتصال بالدعم.';
    }
    if (
      (selectedMethod === 'shamCash' || selectedMethod === 'siretelCash') &&
      (!activeAccount.accountName || !activeAccount.accountNumber)
    ) {
      return 'معلومات التحويل (اسم المستفيد أو رقم الحساب) غير مكتملة، يرجى تجربة طريقة أخرى أو الاتصال بالدعم.';
    }
    return null;
  }, [activeAccount, selectedMethod]);

const handleSubmit = useCallback(
    async (e) => {
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

        // ✅ إرسال إشعار إلى بوت الإيداع عبر الخدمة الجديدة
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
          // ✅ استخدام notifyDeposit بدلاً من sendTelegramDepositMessage
          await notifyDeposit(
            docRef.id,
            depositMessage,
            amountNum,
            userData.name,
            selectedMethod
          );
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
    },
    [
      hasWhatsapp,
      maintenanceMessage,
      amount,
      minDepositUSD,
      getMinDepositDisplay,
      transactionNumber,
      userData,
      selectedMethod,
      addNotification,
    ]
  );

  // شاشة التحميل
  if (settingsLoading) {
    return (
      <div className="topup-page" dir="rtl">
     
        <div className="topup-loading">
          <div className="spinner-small"></div>
          <p>جاري تحميل طرق الدفع...</p>
        </div>
      </div>
    );
  }

  // لا توجد إعدادات
  if (!topUpSettings) {
    return (
      <div className="topup-page" dir="rtl">
      
      
        <MaintenanceMessage
          message="لا توجد طرق دفع مفعلة حالياً، يرجى مراجعة الإدارة."
          supportWhatsApp={supportWhatsApp}
        />
        <button
          onClick={() => window.location.reload()}
          className="btn btn--secondary retry-btn"
        >
          <FiRefreshCw /> إعادة تحميل
        </button>
      </div>
    );
  }

  // لا توجد طرق دفع نشطة
  if (methods.length === 0) {
    return (
      <div className="topup-page" dir="rtl">
      
       
        <MaintenanceMessage
          message="لا توجد طرق دفع مفعلة حالياً، يرجى مراجعة الإدارة."
          supportWhatsApp={supportWhatsApp}
        />
        <button
          onClick={() => window.location.reload()}
          className="btn btn--secondary retry-btn"
        >
          <FiRefreshCw /> إعادة تحميل
        </button>
      </div>
    );
  }

  return (
    <div className="topup-page" dir="rtl">
      {/* رأس الصفحة */}
    

      {/* بطاقة الفيزا */}
      

      {/* تحذير واتساب */}
      {!hasWhatsapp && <WhatsappWarning />}

      {/* طرق الدفع */}
      <div className="topup-page__methods">
        <h3 className="section-title">
          <FaMoneyBillWave style={{ marginLeft: '0.5rem' }} />
          اختر طريقة الدفع
        </h3>
        <div className="payment-methods-grid">
          {methods.map((method) => (
            <div
              key={method.id}
              className={`payment-card ${selectedMethod === method.id ? 'payment-card--active' : ''}`}
              onClick={() => setSelectedMethod(method.id)}
            >
              <div className="payment-card__logo">
                {method.activeAccount?.logoImage ? (
                  <img src={method.activeAccount.logoImage} alt={method.name} loading="lazy" />
                ) : (
                  <span className="payment-card__icon">{method.icon}</span>
                )}
              </div>
              <div className="payment-card__name">{method.name}</div>
              {selectedMethod === method.id && (
                <div className="payment-card__check">✓</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <PaymentMethods />

      {/* تفاصيل الحساب النشط */}
      {selectedMethod && activeAccount && (
        <div className="selected-method-details">
          <h3 className="section-title">
            <FaCreditCard style={{ marginLeft: '0.5rem' }} />
            تفاصيل التحويل
          </h3>
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
                    <FaCopy />
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
            {(selectedMethod === 'shamCash' || selectedMethod === 'siretelCash') &&
              activeAccount.accountName && (
                <div className="detail-item">
                  <span className="detail-label">اسم المستفيد:</span>
                  <span className="detail-value">{activeAccount.accountName}</span>
                </div>
              )}
            {(selectedMethod === 'shamCash' || selectedMethod === 'siretelCash') &&
              activeAccount.accountNumber && (
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
                      <FaCopy />
                    </button>
                  </div>
                </div>
              )}
          </div>

          {activeAccount.qrCode && (
            <div className="qr-section">
              <div className="qr-image-wrapper">
                <img src={activeAccount.qrCode} alt="رمز QR" className="qr-image" loading="lazy" />
                <FaQrcode className="qr-icon" />
              </div>
              <button
                className="download-qr-btn"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = activeAccount.qrCode;
                  link.download = `qr_${selectedMethod}.png`;
                  link.click();
                }}
              >
                <FaQrcode style={{ marginLeft: '0.3rem' }} /> تحميل رمز QR
              </button>
            </div>
          )}

          <div className="min-deposit-notice">
            ⚠️ الحد الأدنى للإيداع: <strong>{getMinDepositDisplay()}</strong>
          </div>
        </div>
      )}

      {/* دعم واتساب */}
      <div className="support-note">
        <p>
          <FaPhoneAlt style={{ marginLeft: '0.3rem' }} />
          للإيداع السريع والتواصل مع الدعم الفني:
        </p>
        <a
          href={`https://wa.me/${supportWhatsApp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="whatsapp-support-btn"
        >
          <FaPhoneAlt style={{ marginLeft: '0.3rem' }} /> تواصل عبر واتساب للدعم
        </a>
      </div>

      {/* نموذج الإيداع */}
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