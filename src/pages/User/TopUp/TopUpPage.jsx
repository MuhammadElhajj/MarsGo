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
import TopUpMethods from '../../../components/UserComponents/TopUp/TopUpMethods/TopUpMethods';
import TopUpForm from '../../../components/UserComponents/TopUp/TopUpForm/TopUpForm';
import './TopUpPage.css';

export default function TopUpPage() {
  const { userData } = useAuth();
  
  // استخدام useAppStore بدلاً من السياقات القديمة
  const balance = useAppStore((state) => state.balance);
  const currency = useAppStore((state) => state.currency);
  const exchangeRate = useAppStore((state) => state.exchangeRate);
  const topUpSettings = useAppStore((state) => state.topUpSettings);
  const addNotification = useAppStore((state) => state.addNotification);

  const [selectedMethod, setSelectedMethod] = useState(null);
  const [amount, setAmount] = useState('');
  const [transactionNumber, setTransactionNumber] = useState('');
  const [senderName, setSenderName] = useState('');
  const [loading, setLoading] = useState(false);

  const hasWhatsapp = !!userData?.whatsappNumber?.trim();

  // ✅ ترتيب طرق الدفع (بدون إيموجي، احترافي)
  const methods = useMemo(() => {
    if (!topUpSettings) return [];
    const allMethods = [
      { id: 'shamCash', name: 'شام كاش', enabled: topUpSettings.shamCash?.enabled },
      { id: 'siretelCash', name: 'سيريتل كاش', enabled: topUpSettings.siretelCash?.enabled },
      { id: 'usdt', name: 'USDT (تيثر)', enabled: topUpSettings.usdt?.enabled },
    ];
    return allMethods.filter(m => m.enabled);
  }, [topUpSettings]);

  // تعيين الطريقة المفضلة تلقائياً (شام كاش أولاً)
  useEffect(() => {
    if (methods.length > 0 && !selectedMethod) {
      setSelectedMethod(methods[0].id);
    }
  }, [methods, selectedMethod]);

  const currentMethod = useMemo(() => topUpSettings?.[selectedMethod], [topUpSettings, selectedMethod]);
  const supportWhatsApp = useMemo(() => topUpSettings?.supportWhatsApp || '963939454690', [topUpSettings]);

  const {
    minDepositUSD,
    getMinDepositDisplay,
    amountIsInvalid,
    isMaintenance,
  } = useTopUpValidation(topUpSettings, amount, selectedMethod, currency, exchangeRate);

  const maintenanceMessage = useMemo(() => {
    if (!currentMethod?.address && !currentMethod?.accountNumber) {
      return 'معلومات التحويل لهذه الطريقة غير مكتملة، يرجى تجربة طريقة أخرى أو الاتصال بالدعم.';
    }
    return 'خدمة شحن الرصيد غير متاحة حالياً، يرجى المحاولة لاحقاً.';
  }, [currentMethod]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (!hasWhatsapp) {
      showToast('يرجى إضافة رقم واتساب في ملفك الشخصي أولاً', 'error', 5000);
      return;
    }
    if (isMaintenance) {
      showToast('خدمة شحن الرصيد في صيانة حالياً، يرجى المحاولة لاحقاً', 'error');
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
    if (!senderName) {
      showToast('يرجى إدخال اسم المرسل', 'error');
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
        senderName,
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
            senderName,
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
      setSenderName('');
    } catch (error) {
      console.error(error);
      showToast('فشل إرسال الطلب', 'error');
    } finally {
      setLoading(false);
    }
  }, [hasWhatsapp, isMaintenance, amount, minDepositUSD, getMinDepositDisplay, transactionNumber, senderName, userData, selectedMethod, addNotification]);

  // حالة تحميل الإعدادات
  if (!topUpSettings) {
    return (
      <div className="topup-page" dir="rtl">
        <div className="topup-page__header">
          <GoBackButton text="رجوع" />
          <h2>شحن الرصيد</h2>
        </div>
        <div className="current-balance-card">
          <div className="balance-label">رصيدك الحالي</div>
          <div className="balance-amount">{balance.toFixed(2)} $</div>
        </div>
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
        <div className="current-balance-card">
          <div className="balance-label">رصيدك الحالي</div>
          <div className="balance-amount">{balance.toFixed(2)} $</div>
        </div>
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

      <div className="current-balance-card">
        <div className="balance-label">رصيدك الحالي</div>
        <div className="balance-amount">{balance.toFixed(2)} $</div>
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