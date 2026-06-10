// src/pages/User/VerifyCode/VerifyCodePage.jsx
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from '../../../firebase';
import { signOut } from 'firebase/auth';
import './VerifyCodePage.css';

export default function VerifyCodePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [uid, setUid] = useState('');

  useEffect(() => {
    const state = location.state;
    if (state && state.email && state.uid) {
      setEmail(state.email);
      setUid(state.uid);
    } else {
      setError('بيانات غير صالحة. يرجى المحاولة مرة أخرى.');
      setTimeout(() => navigate('/login'), 3000);
    }
  }, [location, navigate]);

  const functions = getFunctions();
  const verifyCode = httpsCallable(functions, 'verifyCode');
  const sendVerificationCode = httpsCallable(functions, 'sendVerificationCode');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('الرجاء إدخال كود التفعيل');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const result = await verifyCode({ email, uid, code });
      if (result.data.success) {
        await signOut(auth);
        setMessage('✅ تم تفعيل حسابك بنجاح! يمكنك الآن تسجيل الدخول.');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(result.data.message || 'كود غير صحيح، يرجى المحاولة مرة أخرى');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'حدث خطأ في التحقق من الكود. تأكد من اتصالك بالإنترنت وحاول مجدداً.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const result = await sendVerificationCode({ email, uid });
      if (result.data.success) {
        setMessage('✅ تم إعادة إرسال كود التفعيل إلى بريدك الإلكتروني');
      } else {
        setError('فشل إعادة الإرسال، حاول مرة أخرى');
      }
    } catch (err) {
      console.error(err);
      setError('حدث خطأ أثناء إعادة الإرسال');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verify-code-container">
      <div className="verify-code-card">
        <div className="verify-code-header">
          <h2> تأكيد الحساب</h2>
          <p>تم إرسال كود التاكيد إلى بريدك الإلكتروني</p>
          <p className="verify-code-email">{email}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="text"
              placeholder="أدخل الكود "
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              autoFocus
              dir="ltr"
            />
          </div>

          {error && <div className="verify-code-error">{error}</div>}
          {message && <div className="verify-code-success">{message}</div>}

          <button type="submit" className="verify-submit" disabled={loading}>
            {loading ? 'جاري التحقق...' : 'تاكيد '}
          </button>
        </form>

        <div className="verify-code-footer">
          <button onClick={handleResendCode} disabled={loading} className="resend-btn">
            لم يصلك الكود؟ إعادة الإرسال
          </button>
          <button onClick={() => navigate('/login')} className="back-to-login">
          العودة إلى تسجيل الدخول
          </button>
        </div>
      </div>
    </div>
  );
}