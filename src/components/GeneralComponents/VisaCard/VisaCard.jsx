
// import { useNavigate } from 'react-router-dom';
// import './VisaCard.css';

// export default function VisaCard({ 
//   balance, 
//   mgcBalance = 0,
//   cardHolderName = "MarsGo User", 
//   cardNumber = "4532 1234 5678 9012", 
//   brand = "MarsGo",
//   secret = null,
//   onTopUp
// }) {
//   const navigate = useNavigate();
//   const formattedNumber = cardNumber.replace(/(\d{4})/g, '$1 ').trim();

//   const handleTopUp = () => {
//     if (onTopUp) {
//       onTopUp();
//     } else {
//       navigate('/topup');
//     }
//   };

//   return (
//     <div className="visa-card">
//       <div className="visa-card__bg"></div>
//       <div className="visa-card__content">
//         <div className="visa-card__header">
//           <div className="visa-card__brand">{brand}</div>
//         </div>
//         <div className="visa-card__number">{formattedNumber}</div>
        
//         {/* الرصيد المتاح + رصيد MGC + الرقم السري في صف واحد */}
//         <div className="visa-card__info-row">
//           <div className="visa-card__info-item">
//             <span>الرصيد المتاح</span>
//             <strong>{balance.toFixed(2)} $</strong>
//           </div>
//           <div className="visa-card__info-item mgc">
//             <span>رصيد MGC</span>
//             <strong>{mgcBalance.toFixed(2)} MGC</strong>
//           </div>
//           <div className="visa-card__info-item secret">
//             <span>الرقم السري</span>
//             <strong>{secret || '—'}</strong>
//           </div>
//         </div>

//         <div className="visa-card__holder">
//           <div>
//             <span>اسم حامل البطاقة</span>
//             <div className="visa-card__holder-row">
//               <div className="visa-card__holder-name">{cardHolderName}</div>
//             </div>
//           </div>
//           <button className="visa-card__topup-btn" onClick={handleTopUp}>
//             شحن
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }



import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { FiEye, FiEyeOff, FiSend, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import './VisaCard.css';

export default function VisaCard({
  balance,
  mgcBalance = 0,
  cardHolderName = 'MarsGo User',
  cardNumber = '4532 1234 5678 9012',
  brand = 'MarsGo',
  secret = null,
  onTopUp,
}) {
  const navigate = useNavigate();
  const { user } = useAuth();

  // حالة إظهار/إخفاء الرقم السري
  const [secretVisible, setSecretVisible] = useState(false);
  // حالة نموذج إدخال الكود
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [code, setCode] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' }); // 'success' or 'error'
  const [countdown, setCountdown] = useState(0);

  const functions = getFunctions();
  // ✅ استخدام الدالة الجديدة المخصصة (تم إزالة httpsCallable للدالة القديمة)
  // const sendSecretVerificationCode = httpsCallable(functions, 'sendSecretVerificationCode');
  const verifyCodeFn = httpsCallable(functions, 'verifyCode');

  const timerRef = useRef(null);
  const countdownRef = useRef(null);

  const formattedNumber = cardNumber.replace(/(\d{4})/g, '$1 ').trim();

  const handleTopUp = () => {
    if (onTopUp) {
      onTopUp();
    } else {
      navigate('/topup');
    }
  };

  // ✅ إرسال الكود إلى البريد (باستخدام fetch للدالة الجديدة V2)
  const handleSendCode = async () => {
    if (!user) {
      setMessage({ text: 'يجب تسجيل الدخول أولاً', type: 'error' });
      return;
    }
    if (!secret) {
      setMessage({ text: 'لا يوجد رقم سري لعرضه', type: 'error' });
      return;
    }

    setIsSendingCode(true);
    setMessage({ text: '', type: '' });

    try {
      // ✅ استخدام fetch بدلاً من httpsCallable للدالة الجديدة
      const response = await fetch(
        'https://us-central1-marsgo-bec3a.cloudfunctions.net/sendSecretVerificationCodeV2',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email, uid: user.uid }),
        }
      );

      const result = await response.json();

      if (result.success) {
        setMessage({ text: '✅ تم إرسال كود التأكيد إلى بريدك الإلكتروني', type: 'success' });
        setShowCodeInput(true);
      } else {
        const errorMsg = result.error?.message || result.error || 'فشل إرسال الكود، حاول مرة أخرى';
        setMessage({ text: `❌ ${errorMsg}`, type: 'error' });
      }
    } catch (error) {
      console.error('❌ Error sending code:', error);
      setMessage({ text: '❌ حدث خطأ أثناء إرسال الكود', type: 'error' });
    } finally {
      setIsSendingCode(false);
    }
  };

  // التحقق من الكود (نفس الدالة السابقة)
  const handleVerifyCode = async () => {
    if (!code || code.length < 6) {
      setMessage({ text: '⚠️ الرجاء إدخال الكود المكون من 6 أرقام', type: 'error' });
      return;
    }
    setIsVerifying(true);
    setMessage({ text: '', type: '' });
    try {
      const result = await verifyCodeFn({ email: user.email, uid: user.uid, code });
      if (result.data.success) {
        setMessage({ text: 'تم التحقق بنجاح! سيظهر الرقم السري لمدة 60 ثانية', type: 'success' });
        setSecretVisible(true);
        setShowCodeInput(false);
        setCode('');
        setCountdown(60);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          setSecretVisible(false);
          setCountdown(0);
        }, 60000);
        if (countdownRef.current) clearInterval(countdownRef.current);
        countdownRef.current = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(countdownRef.current);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setMessage({ text: ' الكود غير صحيح أو منتهي الصلاحية', type: 'error' });
      }
    } catch (error) {
      console.error(' Error verifying code:', error);
      setMessage({ text: 'الكود غير صحيح', type: 'error' });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCancelCode = () => {
    setShowCodeInput(false);
    setCode('');
    setMessage({ text: '', type: '' });
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const handleToggleSecret = () => {
    if (secretVisible) {
      setSecretVisible(false);
      setCountdown(0);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      return;
    }

    if (!user || !secret) {
      setMessage({ text: 'لا يوجد رقم سري لعرضه', type: 'error' });
      return;
    }

    setShowCodeInput(true);
    setCode('');
    setMessage({ text: '', type: '' });
    handleSendCode();
  };

  return (
    <div className="visa-card">
      <div className="visa-card__bg"></div>
      <div className="visa-card__content">
        <div className="visa-card__header">
          <div className="visa-card__brand">{brand}</div>
        </div>
        <div className="visa-card__number">{formattedNumber}</div>

        <div className="visa-card__info-row">
          <div className="visa-card__info-item">
            <span>الرصيد المتاح</span>
            <strong>{balance.toFixed(2)} $</strong>
          </div>
          <div className="visa-card__info-item mgc">
            <span>رصيد MGC</span>
            <strong>{mgcBalance.toFixed(2)} MGC</strong>
          </div>
          <div className="visa-card__info-item secret">
            <span>الرقم السري</span>
            <strong>
              {secretVisible ? secret : '••••'}
              {secret && (
                <button
                  className="visa-card__secret-toggle"
                  onClick={handleToggleSecret}
                  disabled={isSendingCode || isVerifying}
                  title={secretVisible ? 'إخفاء الرقم' : 'إظهار الرقم'}
                  aria-label={secretVisible ? 'إخفاء الرقم السري' : 'إظهار الرقم السري'}
                >
                  {isSendingCode || isVerifying ? (
                    <span className="visa-card__secret-spinner">⏳</span>
                  ) : secretVisible ? (
                    <FiEyeOff size={16} />
                  ) : (
                    <FiEye size={16} />
                  )}
                </button>
              )}
              {countdown > 0 && (
                <span className="visa-card__countdown"> ({countdown}s)</span>
              )}
            </strong>
          </div>
        </div>

        {showCodeInput && (
          <div className="visa-card__code-section">
            <p className="visa-card__code-hint">
              <FiSend style={{ marginLeft: '0.3rem' }} />
              تم إرسال كود التأكيد إلى بريدك الإلكتروني. أدخله أدناه لتأكيد هويتك.
            </p>
            <div className="visa-card__code-input-row">
              <input
                type="text"
                className="visa-card__code-input"
                placeholder="أدخل الكود (6 أرقام)"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                disabled={isVerifying || secretVisible}
                autoFocus
              />
              <button
                className="visa-card__code-verify-btn"
                onClick={handleVerifyCode}
                disabled={isVerifying || secretVisible || code.length < 6}
              >
                {isVerifying ? 'جاري...' : 'تأكيد'}
              </button>
              <button
                className="visa-card__code-cancel-btn"
                onClick={handleCancelCode}
                disabled={isVerifying}
              >
                إلغاء
              </button>
            </div>
            {message.text && (
              <div className={`visa-card__code-message visa-card__code-message--${message.type}`}>
                {message.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
                <span>{message.text}</span>
              </div>
            )}
            {!message.text && (
              <button
                className="visa-card__code-resend-btn"
                onClick={handleSendCode}
                disabled={isSendingCode || isVerifying || secretVisible}
              >
                {isSendingCode ? 'جاري الإرسال...' : 'إعادة إرسال الكود'}
              </button>
            )}
          </div>
        )}

        <div className="visa-card__holder">
          <div>
            <span>اسم حامل البطاقة</span>
            <div className="visa-card__holder-row">
              <div className="visa-card__holder-name">{cardHolderName}</div>
            </div>
          </div>
          <button className="visa-card__topup-btn" onClick={handleTopUp}>
            شحن
          </button>
        </div>
      </div>
    </div>
  );
}