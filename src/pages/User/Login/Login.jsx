import { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../../../firebase';
import { useNavigate } from 'react-router-dom';
import { useStoreSettings } from '../../../context/StoreSettingsContext';
// import Loading from '../../../components/GeneralComponents/Loading/Loading'; // استيراد مكون التحميل
import Loading from '../../../components/GeneralComponents/Loading/Loading'; // استيراد مكون التحميل
import './Login.css';

export default function Login() {
  const { settings } = useStoreSettings();
  const loginPhoneImage = settings?.loginPhoneImage;
  const [imageLoading, setImageLoading] = useState(true); // حالة تحميل الصورة
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.code === 'auth/email-already-in-use' ? 'البريد مسجل مسبقاً' : 'فشل العملية');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    const provider = new GoogleAuthProvider();
    setLoading(true);
    try {
      await signInWithPopup(auth, provider);
      navigate('/dashboard');
    } catch (err) {
      setError('فشل تسجيل الدخول بحساب Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-wrapper">
        {/* العمود الأيسر – صورة الهاتف مع تحميل */}
      {/* العمود الأيسر – صورة الهاتف مع تحميل دائم */}
<div className="login-phone">
  <div className="phone-mockup">
    {!loginPhoneImage ? (
      // إذا لم توجد صورة في الإعدادات، نظهر مؤشر تحميل دائم
      <div className="phone-loading">
        <Loading />
      </div>
    ) : (
      // إذا توجد صورة
      <>
        {imageLoading && (
          <div className="phone-loading">
            <Loading />
          </div>
        )}
        <img
          src={loginPhoneImage}
          alt="تطبيق MarsGo"
          className="phone-image"
          onLoad={() => setImageLoading(false)}
          onError={() => setImageLoading(false)}
          style={{ display: imageLoading ? 'none' : 'block' }}
        />
      </>
    )}
  </div>
</div>

        {/* العمود الأيمن – نموذج تسجيل الدخول */}
        <div className="login-form-container">
          <div className="login-card">
            <div className="login-logo">
              <span className="login-logo-icon">🌸</span>
              <h1 className="login-title">MarsGo</h1>
            </div>

            <form onSubmit={handleSubmit}>
              {isRegister && (
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="الاسم الكامل"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              )}
              <div className="input-group">
                <input
                  type="email"
                  placeholder="البريد الإلكتروني"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <input
                  type="password"
                  placeholder="كلمة المرور"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              {error && <div className="login-error">{error}</div>}
              <button type="submit" className="login-submit" disabled={loading}>
                {loading ? 'جاري...' : isRegister ? 'إنشاء حساب' : 'تسجيل الدخول'}
              </button>
            </form>

            <div className="login-divider">
              <span className="divider-text">أو</span>
            </div>

            <button className="google-login" onClick={handleGoogle} disabled={loading}>
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#fff" d="M12 0C5.372 0 0 5.373 0 12s5.372 12 12 12c6.627 0 12-5.373 12-12S18.627 0 12 0zm.14 19.018c-3.868 0-7-3.14-7-7.018 0-3.878 3.132-7.018 7-7.018 1.89 0 3.47.696 4.682 1.836l-1.895 1.825c-.521-.5-1.426-1.08-2.787-1.08-2.385 0-4.332 1.977-4.332 4.437s1.947 4.437 4.332 4.437c2.77 0 3.8-1.99 3.96-3.02h-3.96v-2.46h6.59c.06.349.11.695.11 1.152 0 3.98-2.67 6.8-6.7 6.8z"/>
              </svg>
              متابعة بحساب Google
            </button>

            <div className="login-footer">
              <a href="#" className="forgot-password">نسيت كلمة المرور؟</a>
              <div className="signup-switch">
                {isRegister ? 'لديك حساب بالفعل؟' : 'ليس لديك حساب؟'}{' '}
                <button type="button" className="switch-btn" onClick={() => setIsRegister(!isRegister)}>
                  {isRegister ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* روابط التذييل أسفل الصف */}
      <div className="login-footer-links">
        <a href="#">Meta</a>
        <a href="#">حول</a>
        <a href="#">المدونة</a>
        <a href="#">وظائف</a>
        <a href="#">مساعدة</a>
        <a href="#">API</a>
        <a href="#">الخصوصية</a>
        <a href="#">الشروط</a>
        <a href="#">المواقع الشائعة</a>
        <a href="#">Instagram Lite</a>
        <a href="#">Threads</a>
      </div>
      <div className="login-copyright">© {new Date().getFullYear()} MarsGo من Meta</div>
    </div>
  );
}