// src/pages/User/Login/Login.jsx
// هذا الملف مسؤول عن واجهة تسجيل الدخول وإنشاء حساب جديد.
// يستخدم Firebase Authentication و Cloud Functions لإرسال كود التفعيل.

import { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { auth } from '../../../firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useNavigate } from 'react-router-dom';
import { useStoreSettings } from '../../../context/StoreSettingsContext';
import './Login.css';
import Logo1 from "../../../assets/logo-light.png";

// ========== صورة افتراضية لصفحة تسجيل الدخول (تظهر في حال عدم وجود صورة مخصصة) ==========
const DEFAULT_PHONE_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 350'%3E%3Crect width='200' height='350' fill='%234f46e5'/%3E%3Ccircle cx='100' cy='120' r='40' fill='%23ffffff' opacity='0.8'/%3E%3Crect x='60' y='180' width='80' height='10' rx='5' fill='%23ffffff' opacity='0.6'/%3E%3Crect x='50' y='210' width='100' height='10' rx='5' fill='%23ffffff' opacity='0.4'/%3E%3Crect x='70' y='240' width='60' height='10' rx='5' fill='%23ffffff' opacity='0.3'/%3E%3Ctext x='100' y='300' font-size='20' text-anchor='middle' fill='white' font-family='Arial'%3EMarsGo%3C/text%3E%3C/svg%3E";

// ========== دالة فحص قوة كلمة المرور (مخففة) ==========
const isStrongPassword = (password) => {
  // الشروط: طول 6 أحرف على الأقل
  const regex = /^.{6,}$/;
  return regex.test(password);
};

export default function Login() {
  // ========== إعدادات الصورة من المتجر ==========
  const { settings } = useStoreSettings();
  const loginPhoneImage = settings?.loginPhoneImage;
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [showDefault, setShowDefault] = useState(false);
  
  // ========== حالة النموذج ==========
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const navigate = useNavigate();

  // ========== تهيئة دوال Cloud Functions ==========
  const functions = getFunctions();
  const sendVerificationCode = httpsCallable(functions, 'sendVerificationCode');
  const checkEmailVerified = httpsCallable(functions, 'checkEmailVerified');

  // ========== تحميل صورة الهاتف ==========
  useEffect(() => {
    if (!loginPhoneImage) {
      setImageLoading(false);
      setShowDefault(true);
      return;
    }
    const img = new Image();
    img.onload = () => {
      setImageLoading(false);
      setImageError(false);
      setShowDefault(false);
    };
    img.onerror = () => {
      setImageLoading(false);
      setImageError(true);
      setShowDefault(true);
    };
    img.src = loginPhoneImage;
  }, [loginPhoneImage]);

  // ========== معالجة تغيير كلمة المرور ==========
  const handlePasswordChange = (e) => {
    const newPass = e.target.value;
    setPassword(newPass);
    if (isRegister && newPass && !isStrongPassword(newPass)) {
      setPasswordError('كلمة المرور يجب أن تحتوي على 6 أحرف على الأقل');
    } else {
      setPasswordError('');
    }
  };

  // ========== إرسال النموذج (تسجيل دخول / إنشاء حساب) ==========
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isRegister) {
      // --- تسجيل مستخدم جديد ---
      if (!isStrongPassword(password)) {
        setError('كلمة المرور يجب أن تحتوي على 6 أحرف على الأقل');
        setLoading(false);
        return;
      }
      if (!name.trim()) {
        setError('الرجاء إدخال الاسم الكامل');
        setLoading(false);
        return;
      }

      try {
        // 1. إنشاء الحساب في Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
console.log("📧 Email being used for signup:", email);
        // 2. تسجيل الخروج فوراً (لأن البريد لم يفعل بعد)
        // await signOut(auth);

        // 3. طباعة البيانات المرسلة للتشخيص
        console.log("📤 Sending verification code with:", { email: user.email, uid: user.uid });

        // 4. استدعاء Cloud Function لإرسال كود التفعيل
        const result = await sendVerificationCode({ email: user.email, uid: user.uid });
        
        if (result.data.success) {
          // تخزين البريد مؤقتاً (اختياري)
          sessionStorage.setItem('pendingVerificationEmail', email);
          // التوجيه إلى صفحة إدخال الكود
          navigate('/verify-code', { state: { email, uid: user.uid } });
        } else {
          throw new Error(result.data.message || 'فشل إرسال كود التفعيل');
        }
      } catch (err) {
        let msg = 'فشل إنشاء الحساب';
        if (err.code === 'auth/email-already-in-use') msg = 'البريد مسجل مسبقاً';
        else if (err.message) msg = err.message;
        // تحسين رسالة الخطأ عند فشل Cloud Function (مثل 400)
        if (err?.code?.startsWith('functions/')) {
          msg = err.message || 'خطأ في إرسال كود التفعيل، حاول مرة أخرى';
        }
        setError(msg);
      } finally {
        setLoading(false);
      }
    } else {
      // --- تسجيل الدخول لمستخدم موجود ---
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const verResult = await checkEmailVerified({ uid: user.uid });
        if (verResult.data.verified) {
          navigate('/dashboard');
        } else {
          // البريد لم يفعل: إرسال كود جديد والتوجيه إلى صفحة التحقق
          await sendVerificationCode({ email: user.email, uid: user.uid });
          navigate('/verify-code', { state: { email: user.email, uid: user.uid } });
        }
      } catch (err) {
        let msg = 'فشل تسجيل الدخول';
        if (err.code === 'auth/user-not-found') msg = 'لا يوجد حساب بهذا البريد';
        else if (err.code === 'auth/wrong-password') msg = 'كلمة المرور غير صحيحة';
        else if (err.code === 'auth/too-many-requests') msg = 'محاولات كثيرة، حاول لاحقاً';
        else if (err.message) msg = err.message;
        setError(msg);
        setLoading(false);
      }
    }
  };

  // ========== تسجيل الدخول عبر Google ==========
  const handleGoogle = async () => {
    const provider = new GoogleAuthProvider();
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const verResult = await checkEmailVerified({ uid: user.uid });
      if (verResult.data.verified) {
        navigate('/dashboard');
      } else {
        await sendVerificationCode({ email: user.email, uid: user.uid });
        navigate('/verify-code', { state: { email: user.email, uid: user.uid } });
      }
    } catch (err) {
      setError('فشل تسجيل الدخول بحساب Google');
    } finally {
      setLoading(false);
    }
  };

  // ========== عرض الواجهة ==========
  return (
    <div className="login-container">
      <div className="login-wrapper">
        {/* العمود الأيسر: صورة الهاتف */}
        <div className="login-phone">
          <div className="phone-mockup">
            {loginPhoneImage && imageLoading && !showDefault && (
              <div className="phone-loading">
                <div className="spinner-small"></div>
              </div>
            )}
            {(!imageLoading || showDefault) && (
              <img
                src={showDefault ? DEFAULT_PHONE_IMAGE : loginPhoneImage}
                alt="تطبيق MarsGo"
                className="phone-image"
                style={{ display: 'block' }}
              />
            )}
          </div>
        </div>

        {/* العمود الأيمن: نموذج تسجيل الدخول */}
        <div className="login-form-container">
          <div className="login-card">
            <div className="login-logo">
              <img src={Logo1} alt="Logo" className='Login-Logo--img'/>
              <h1 className="login-title">تسجيل الدخول</h1>
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
              <div className="input-group password-group">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="كلمة المرور"
                  value={password}
                  onChange={handlePasswordChange}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
              {passwordError && <div className="login-error" style={{background: '#fef3c7', color: '#92400e'}}>{passwordError}</div>}
              {error && <div className="login-error">{error}</div>}
              <button type="submit" className="login-submit" disabled={loading}>
                {loading ? 'جاري...' : isRegister ? 'إنشاء حساب' : 'تسجيل الدخول'}
              </button>
            </form>

            <div className="login-divider">
              <span className="divider-text">أو</span>
            </div>

            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading}
              className="google-login"
            >
              <svg className="google-login__icon" viewBox="0 0 24 24" width="20" height="20">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>متابعة بحساب Google</span>
            </button>

            <div className="login-footer">
              <a href="#" className="forgot-password" onClick={(e) => { e.preventDefault(); navigate('/forgot-password'); }}>
                نسيت كلمة المرور؟
              </a>
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