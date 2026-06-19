// src/pages/User/VerifyCode/VerifyCodePage.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from '../../../firebase';
import { signOut } from 'firebase/auth';
import './VerifyCodePage.css';

export default function VerifyCodePage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // State
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [uid, setUid] = useState('');
  
  // Refs to avoid unnecessary re-renders
  const functionsRef = useRef(getFunctions());
  const verifyCodeRef = useRef(httpsCallable(functionsRef.current, 'verifyCode'));
  const sendVerificationCodeRef = useRef(httpsCallable(functionsRef.current, 'sendVerificationCode'));

  // ✅ استلام البيانات من location.state
  useEffect(() => {
    const state = location.state;
    if (state && state.email && state.uid) {
      setEmail(state.email);
      setUid(state.uid);
      // Optionally store in sessionStorage as fallback
      sessionStorage.setItem('verify_email', state.email);
      sessionStorage.setItem('verify_uid', state.uid);
    } else {
      // Fallback: try to read from sessionStorage
      const storedEmail = sessionStorage.getItem('verify_email');
      const storedUid = sessionStorage.getItem('verify_uid');
      if (storedEmail && storedUid) {
        setEmail(storedEmail);
        setUid(storedUid);
        setError('تم استعادة بياناتك، يرجى المحاولة مرة أخرى.');
        setTimeout(() => setError(''), 3000);
      } else {
        setError('بيانات غير صالحة. يرجى العودة إلى صفحة تسجيل الدخول والمحاولة مرة أخرى.');
        setTimeout(() => navigate('/login'), 3000);
      }
    }
  }, [location, navigate]);

  // ✅ التحقق من صحة البيانات قبل أي طلب
  const validateCredentials = useCallback(() => {
    if (!email || !uid) {
      setError('بيانات المستخدم مفقودة. يرجى العودة إلى صفحة التسجيل.');
      return false;
    }
    return true;
  }, [email, uid]);

  // ✅ إرسال كود التفعيل
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('الرجاء إدخال كود التفعيل');
      return;
    }
    if (!validateCredentials()) return;

    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      const result = await verifyCodeRef.current({ email, uid, code });
      if (result.data.success) {
        // Clear stored data after success
        sessionStorage.removeItem('verify_email');
        sessionStorage.removeItem('verify_uid');
        await signOut(auth);
setMessage(' تم تفعيل حسابك بنجاح! اهلا بك في مارسفو...');
setTimeout(() => navigate('/dashboard', { replace: true }), 1000);
      } else {
        setError(result.data.message || 'كود غير صحيح، يرجى المحاولة مرة أخرى');
      }
    } catch (err) {
      console.error('Verify error:', err);
      const errorMsg = err.message || 'حدث خطأ في التحقق من الكود. تأكد من اتصالك بالإنترنت وحاول مجدداً.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // ✅ إعادة إرسال الكود
  const handleResendCode = async () => {
    if (!validateCredentials()) return;
    
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      const result = await sendVerificationCodeRef.current({ email, uid });
      if (result.data.success) {
        setMessage('✅ تم إعادة إرسال كود التفعيل إلى بريدك الإلكتروني');
      } else {
        setError('فشل إعادة الإرسال، حاول مرة أخرى');
      }
    } catch (err) {
      console.error('Resend error:', err);
      setError('حدث خطأ أثناء إعادة الإرسال. تأكد من اتصالك بالإنترنت.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verify-code-container">
      <div className="verify-code-card">
        <div className="verify-code-header">
          <h2>تأكيد الحساب</h2>
          <p>تم إرسال كود التأكيد إلى بريدك الإلكتروني</p>
          <p className="verify-code-email">{email || 'البريد الإلكتروني'}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="text"
              placeholder="أدخل الكود"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              autoFocus
              dir="ltr"
              maxLength={6}
              pattern="[0-9]{6}"
              title="الرجاء إدخال 6 أرقام"
            />
          </div>

          {error && <div className="verify-code-error">{error}</div>}
          {message && <div className="verify-code-success">{message}</div>}

          <button type="submit" className="verify-submit" disabled={loading}>
            {loading ? 'جاري التحقق...' : 'تأكيد'}
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