// src/pages/User/ResetPassword/ResetPasswordPage.jsx
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { FiEye, FiEyeOff, FiArrowLeft } from 'react-icons/fi';
import './ResetPasswordPage.css';

export default function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(location.state?.email || '');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const functions = getFunctions();
  const verifyPasswordResetCode = httpsCallable(functions, 'verifyPasswordResetCode');

  // التحقق من تطابق كلمة المرور
  const passwordsMatch = newPassword === confirmPassword;
  const isFormValid = email && code && newPassword && confirmPassword && passwordsMatch && newPassword.length >= 6;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!passwordsMatch) {
      setError('كلمة المرور وتأكيدها غير متطابقتين');
      return;
    }
    if (newPassword.length < 6) {
      setError('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const result = await verifyPasswordResetCode({
        email: email,
        code: code,
        newPassword: newPassword
      });

      if (result?.data?.success) {
        setMessage(result.data.message || '✅ تم تغيير كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول.');
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setError(result?.data?.message || '❌ حدث خطأ غير معروف');
      }
    } catch (err) {
      console.error('Reset error:', err);
      setError(err.message || '❌ فشل تغيير كلمة المرور. تأكد من صحة الكود والمعلومات.');
    } finally {
      setLoading(false);
    }
  };

  // إذا لم يكن هناك بريد إلكتروني، اذهب إلى صفحة نسيت كلمة المرور
  useEffect(() => {
    if (!email && !location.state?.email) {
      navigate('/forgot-password');
    }
  }, [email, location.state, navigate]);

  return (
    <div className="reset-password-container">
      <div className="reset-password-card">
        <button className="back-button" onClick={() => navigate('/login')}>
          <FiArrowLeft /> العودة إلى تسجيل الدخول
        </button>

        <div className="reset-header">
          <h2>إعادة تعيين كلمة المرور</h2>
          <p>أدخل الكود المرسل إلى بريدك الإلكتروني ثم اختر كلمة مرور جديدة</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>البريد الإلكتروني</label>
            <input
              type="email"
              placeholder="example@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              readOnly={!!location.state?.email}
              className={location.state?.email ? 'readonly-field' : ''}
            />
          </div>

          <div className="input-group">
            <label>كود التفعيل</label>
            <input
              type="text"
              placeholder="أدخل الكود المكون من 6 أرقام"
              value={code}
              onChange={(e) => setCode(e.target.value.slice(0, 6))}
              required
              dir="ltr"
              className="code-input"
            />
          </div>

          <div className="input-group password-group">
            <label>كلمة المرور الجديدة</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="إظهار/إخفاء كلمة المرور"
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <div className="input-group password-group">
            <label>تأكيد كلمة المرور</label>
            <div className="password-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label="إظهار/إخفاء تأكيد كلمة المرور"
              >
                {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          {newPassword && confirmPassword && !passwordsMatch && (
            <div className="error-message">⚠️ كلمة المرور وتأكيدها غير متطابقتين</div>
          )}

          {error && <div className="error-message">{error}</div>}
          {message && <div className="success-message">{message}</div>}

          <button
            type="submit"
            className="submit-btn"
            disabled={loading || !isFormValid}
          >
            {loading ? 'جاري التحقق...' : 'تغيير كلمة المرور'}
          </button>
        </form>

        <div className="help-text">
          <span>لم يصلك الكود؟</span>
          <button
            type="button"
            className="resend-link"
            onClick={() => navigate('/forgot-password')}
          >
            إعادة إرسال الكود
          </button>
        </div>
      </div>
    </div>
  );
}