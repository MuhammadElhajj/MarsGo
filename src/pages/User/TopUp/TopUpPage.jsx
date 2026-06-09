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
import { sendTelegramDepositMessage, formatDepositMessage } from '../../../utils/depositBot';
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
    { id: 'usdt', name: 'USDT', icon: '', enabled: settings.usdt?.enabled },
    { id: 'shamCash', name: 'شام كاش', icon: '', enabled: settings.shamCash?.enabled },
    { id: 'siretelCash', name: 'سيريتل كاش', icon: '', enabled: settings.siretelCash?.enabled },
  ].filter(m => m.enabled);

  const currentMethod = settings[selectedMethod];
  const supportWhatsApp = settings.supportWhatsApp || '963939454690';
  const maintenanceMessage = !currentMethod?.address && !currentMethod?.accountNumber
    ? '🚧 عذراً، خدمة شحن الرصيد غير متاحة حالياً بسبب تحديث معلومات التحويل. يرجى المحاولة لاحقاً.'
    : '🚧 معلومات التحويل لهذه الطريقة غير مكتملة، يرجى تجربة طريقة دفع أخرى أو الاتصال بالدعم.';

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!hasWhatsapp) {
      showToast(' يرجى إضافة رقم واتساب في ملفك الشخصي أولاً', 'error', 5000);
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

    setLoading(true);
    try {
      // ✅ إزالة receiptImage من البيانات المرسلة إلى Firestore
      const docRef = await addDoc(collection(db, 'topUpRequests'), {
        userId: userData.uid,
        userName: userData.name,
        amount: parseFloat(amount),
        paymentMethod: selectedMethod,
        transactionNumber,
        senderName,
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
        // ✅ تمرير requestId كمعامل ثانٍ
        await sendTelegramDepositMessage(depositMessage, docRef.id);
      } catch (telegramErr) {
        console.error('❌ فشل إرسال إشعار التلغرام:', telegramErr);
      }

      showToast('✅ تم إرسال طلب الشحن، سيتم مراجعته قريباً', 'success');
      setAmount('');
      setTransactionNumber('');
      setSenderName('');
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
            senderName={senderName}
            setSenderName={setSenderName}
            loading={loading}
            onSubmit={handleSubmit}
          />
        </>
      )}
    </div>
  );
}