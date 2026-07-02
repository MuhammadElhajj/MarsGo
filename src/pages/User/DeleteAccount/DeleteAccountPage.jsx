// src/pages/User/DeleteAccount/DeleteAccountPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAuth } from '../../../context/AuthContext';
import GoBackButton from '../../../components/GeneralComponents/GoBackButton/GoBackButton';
import Button from '../../../components/GeneralComponents/Button/Button';
import { showToast } from '../../../components/GeneralComponents/ToastNotification/ToastNotification';
import { FiAlertTriangle, FiMail } from 'react-icons/fi';
import './DeleteAccountPage.css';

export default function DeleteAccountPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const handleSendCode = async () => {
    if (!user) {
      showToast('يجب تسجيل الدخول أولاً', 'error');
      return;
    }

    setLoading(true);
    setError('');
    setEmailSent(false);

    try {
      const functions = getFunctions();
      const sendCodeFn = httpsCallable(functions, 'sendDeleteVerificationCode');
      const result = await sendCodeFn();

      if (result.data.success) {
        setEmailSent(true);
        showToast('✅ تم إرسال كود التحقق إلى بريدك الإلكتروني', 'success');
      } else {
        setError('فشل إرسال الكود، حاول مرة أخرى');
      }
    } catch (err) {
      console.error('خطأ في إرسال الكود:', err);
      setError(err.message || 'حدث خطأ أثناء إرسال الكود');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="delete-account-page">
      <div className="delete-account-card">
       

        <div className="delete-account-card__icon">
          <FiAlertTriangle />
        </div>

        <h1 className="delete-account-card__title">حذف الحساب</h1>
        <p className="delete-account-card__description">
          هذا الإجراء <strong>نهائي ولا يمكن التراجع عنه</strong>. سيتم حذف جميع بياناتك بشكل دائم.
        </p>

        {emailSent ? (
          <div className="delete-account-card__success">
            <FiMail className="delete-account-card__success-icon" />
            <p>تم إرسال كود التحقق إلى بريدك الإلكتروني.</p>
            <p className="delete-account-card__success-hint">
              يرجى فتح بريدك الإلكتروني ونسخ الكود، ثم التوجه إلى صفحة تأكيد الحذف.
            </p>
            <Button
              onClick={() => navigate('/verify-delete-account')}
              variant="primary"
              className="delete-account-card__verify-btn"
            >
              الذهاب إلى صفحة التأكيد
            </Button>
          </div>
        ) : (
          <>
            <div className="delete-account-card__warning">
              <FiAlertTriangle />
              <span>سيتم إرسال كود تحقق إلى بريدك الإلكتروني لتأكيد عملية الحذف</span>
            </div>

            {error && (
              <div className="delete-account-card__error">
                <FiAlertTriangle />
                <span>{error}</span>
              </div>
            )}

            <div className="delete-account-card__actions">
              <Button
                onClick={handleSendCode}
                disabled={loading}
                variant="danger"
                className="delete-account-card__send-btn"
              >
                {loading ? 'جاري الإرسال...' : 'إرسال كود التحقق'}
              </Button>
              <Button
                onClick={() => navigate('/profile')}
                variant="secondary"
                className="delete-account-card__cancel-btn"
              >
                إلغاء
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}