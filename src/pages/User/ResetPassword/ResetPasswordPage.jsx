// src/pages/User/ResetPassword/ResetPasswordPage.jsx
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
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

  const functions = getFunctions();
  const verifyPasswordResetCode = httpsCallable(functions, 'verifyPasswordResetCode');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email.trim()) {
      setError('البريد الإلكتروني مطلوب');
      return;
    }
    if (!code.trim()) {
      setError('الكود مطلوب');
      return;
    }
    if (newPassword.length < 6) {
      setError('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('كلمة المرور غير متطابقة');
      return;
    }

    setLoading(true);
    try {
      const result = await verifyPasswordResetCode({ email, code, newPassword });
      if (result.data.success) {
        setMessage('✅ تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول.');
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setError(result.data.message || 'فشل تغيير كلمة المرور');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'حدث خطأ، حاول مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-password-container">
      <div className="reset-password-card">
        <h2>إعادة تعيين كلمة المرور</h2>
        <p>أدخل الكود المرسل إلى بريدك وكلمة المرور الجديدة</p>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="email"
              placeholder="البريد الإلكتروني"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              readOnly={!!location.state?.email}
            />
          </div>
          <div className="input-group">
            <input
              type="text"
              placeholder="كود التفعيل (6 أرقام)"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              dir="ltr"
            />
          </div>
          <div className="input-group password-group">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="كلمة المرور الجديدة"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
          <div className="input-group">
            <input
              type="password"
              placeholder="تأكيد كلمة المرور الجديدة"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          {message && <div className="success-message">{message}</div>}
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'جاري التحقق...' : 'تغيير كلمة المرور'}
          </button>
        </form>
        <div className="back-to-login">
          <button onClick={() => navigate('/login')}>← العودة إلى تسجيل الدخول</button>
        </div>
      </div>
    </div>
  );
}