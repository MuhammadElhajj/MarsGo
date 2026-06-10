// src/pages/User/ForgotPassword/ForgotPasswordPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
import './ForgotPasswordPage.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const functions = getFunctions();
  const sendPasswordResetCode = httpsCallable(functions, 'sendPasswordResetCode');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('الرجاء إدخال البريد الإلكتروني');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const result = await sendPasswordResetCode({ email });
      if (result.data.success) {
        setMessage('✅ تم إرسال كود إعادة التعيين إلى بريدك الإلكتروني (تحقق من صندوق الوارد أو spam).');
        // التوجه إلى صفحة إعادة التعيين بعد 3 ثوانٍ
        setTimeout(() => {
          navigate('/reset-password', { state: { email } });
        }, 3000);
      } else {
        setError('حدث خطأ، حاول مرة أخرى');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'فشل إرسال الكود');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <h2>نسيت كلمة المرور</h2>
        <p>أدخل بريدك الإلكتروني، وسنرسل لك كوداً لإعادة التعيين</p>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="email"
              placeholder="البريد الإلكتروني"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          {message && <div className="success-message">{message}</div>}
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'جاري الإرسال...' : 'إرسال كود إعادة التعيين'}
          </button>
        </form>
        <div className="back-to-login">
          <button onClick={() => navigate('/login')}>← العودة إلى تسجيل الدخول</button>
        </div>
      </div>
    </div>
  );
}