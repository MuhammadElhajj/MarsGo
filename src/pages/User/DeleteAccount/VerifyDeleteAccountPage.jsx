// src/pages/User/DeleteAccount/VerifyDeleteAccountPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import GoBackButton from '../../../components/GeneralComponents/GoBackButton/GoBackButton';
import Button from '../../../components/GeneralComponents/Button/Button';
import Input from '../../../components/GeneralComponents/Input/Input';
import { showToast } from '../../../components/GeneralComponents/ToastNotification/ToastNotification';
import { FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import './VerifyDeleteAccountPage.css';

export default function VerifyDeleteAccountPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerifyAndDelete = async () => {
    if (!code || code.length < 6) {
      setError('الرجاء إدخال الكود المكون من 6 أرقام');
      return;
    }

    if (!user) {
      setError('يجب تسجيل الدخول أولاً');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = await user.getIdToken();
      const response = await fetch(
        'https://us-central1-marsgo-bec3a.cloudfunctions.net/verifyAndDeleteAccount',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ code }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        showToast('تم حذف حسابك بنجاح', 'success');
        // تسجيل الخروج بعد الحذف
        const { signOut } = await import('firebase/auth');
        const { auth } = await import('../../../firebase');
        await signOut(auth);
        navigate('/login', { replace: true });
      } else {
        setError(data.error || 'فشل حذف الحساب');
      }
    } catch (err) {
      console.error('خطأ في التحقق والحذف:', err);
      setError(err.message || 'حدث خطأ أثناء التحقق من الكود');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verify-delete-page">
      <div className="verify-delete-card">
     

        <div className="verify-delete-card__icon">
          <FiCheckCircle />
        </div>

        <h1 className="verify-delete-card__title">تأكيد حذف الحساب</h1>
        <p className="verify-delete-card__description">
          أدخل الكود الذي تم إرساله إلى بريدك الإلكتروني لتأكيد عملية الحذف.
        </p>

        <div className="verify-delete-card__code-section">
          <Input
            label="كود التحقق (6 أرقام)"
            type="text"
            placeholder="أدخل الكود"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="verify-delete-card__input"
            autoFocus
            maxLength={6}
          />
        </div>

        {error && (
          <div className="verify-delete-card__error">
            <FiAlertTriangle />
            <span>{error}</span>
          </div>
        )}

        <div className="verify-delete-card__warning">
          <FiAlertTriangle />
          <span>هذا الإجراء نهائي ولا يمكن التراجع عنه</span>
        </div>

        <div className="verify-delete-card__actions">
          <Button
            onClick={handleVerifyAndDelete}
            disabled={loading || code.length < 6}
            variant="danger"
            className="verify-delete-card__delete-btn"
          >
            {loading ? 'جاري الحذف...' : 'تأكيد حذف الحساب'}
          </Button>
          <Button
            onClick={() => navigate('/profile')}
            variant="secondary"
            className="verify-delete-card__cancel-btn"
          >
            إلغاء
          </Button>
        </div>
      </div>
    </div>
  );
}