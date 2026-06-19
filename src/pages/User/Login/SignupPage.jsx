// src/pages/User/Login/SignupPage.jsx
import { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../../firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../../store/store';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';
import './SignupPage.css';
import Logo1 from "../../../assets/logo-light.png";
import { FiEyeOff , FiEye } from 'react-icons/fi';
const DEFAULT_PHONE_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 350'%3E%3Crect width='200' height='350' fill='%234f46e5'/%3E%3Ccircle cx='100' cy='120' r='40' fill='%23ffffff' opacity='0.8'/%3E%3Crect x='60' y='180' width='80' height='10' rx='5' fill='%23ffffff' opacity='0.6'/%3E%3Crect x='50' y='210' width='100' height='10' rx='5' fill='%23ffffff' opacity='0.4'/%3E%3Crect x='70' y='240' width='60' height='10' rx='5' fill='%23ffffff' opacity='0.3'/%3E%3Ctext x='100' y='300' font-size='20' text-anchor='middle' fill='white' font-family='Arial'%3EMarsGo%3C/text%3E%3C/svg%3E";

const isStrongPassword = (password) => /^.{6,}$/.test(password);

export default function SignupPage() {
  const storeSettings = useAppStore((state) => state.storeSettings);
  const loginPhoneImage = storeSettings?.loginPhoneImageUrl;
  const [imageLoading, setImageLoading] = useState(true);
  const [showDefault, setShowDefault] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [referralError, setReferralError] = useState('');
  const [referralUser, setReferralUser] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const navigate = useNavigate();

  const functions = getFunctions();
  const sendVerificationCode = httpsCallable(functions, 'sendVerificationCode');

  // قراءة كود الإحالة من الرابط
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    const storedRef = sessionStorage.getItem('referralCode');
    const finalRef = ref || storedRef || '';
    if (finalRef) {
      setReferralCode(finalRef);
      if (finalRef.length >= 3) {
        verifyReferralCode(finalRef);
      }
    }
  }, []);

  // التحقق من صحة كود الإحالة
  const verifyReferralCode = async (code) => {
    if (!code || code.length < 3) {
      setReferralError('');
      setReferralUser(null);
      return;
    }
    try {
      const q = query(collection(db, 'users'), where('uniqueId', '==', code));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const user = snap.docs[0].data();
        setReferralUser({ id: snap.docs[0].id, ...user });
        setReferralError('');
        sessionStorage.setItem('referralCode', code);
      } else {
        setReferralUser(null);
        setReferralError(' كود الإحالة غير صحيح');
      }
    } catch (err) {
      setReferralError('حدث خطأ في التحقق');
    }
  };

  const handleReferralChange = (e) => {
    const value = e.target.value;
    setReferralCode(value);
    if (value.trim()) {
      sessionStorage.setItem('referralCode', value.trim());
      verifyReferralCode(value.trim());
    } else {
      sessionStorage.removeItem('referralCode');
      setReferralUser(null);
      setReferralError('');
    }
  };

  const handlePasswordChange = (e) => {
    const newPass = e.target.value;
    setPassword(newPass);
    if (newPass && !isStrongPassword(newPass)) {
      setPasswordError('كلمة المرور يجب أن تحتوي على 6 أحرف على الأقل');
    } else {
      setPasswordError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

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
      // حفظ كود الإحالة في sessionStorage ليقرأه AuthContext
      if (referralCode.trim()) {
        sessionStorage.setItem('referralCode', referralCode.trim());
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("📧 Email being used for signup:", email);

      // ✅ تخزين الاسم مؤقتاً ليستخدمه AuthContext عند إنشاء المستند
      if (name.trim()) {
        sessionStorage.setItem('temp_user_name', name.trim());
      }

      const result = await sendVerificationCode({ email: user.email, uid: user.uid });
      if (result.data.success) {
        sessionStorage.setItem('pendingVerificationEmail', email);
        navigate('/verify-code', { state: { email, uid: user.uid } });
      } else {
        throw new Error(result.data.message || 'فشل إرسال كود التفعيل');
      }
    } catch (err) {
      let msg = 'فشل إنشاء الحساب';
      if (err.code === 'auth/email-already-in-use') msg = 'البريد مسجل مسبقاً';
      else if (err.message) msg = err.message;
      if (err?.code?.startsWith('functions/')) {
        msg = err.message || 'خطأ في إرسال كود التفعيل، حاول مرة أخرى';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loginPhoneImage) {
      setImageLoading(false);
      setShowDefault(true);
      return;
    }
    const img = new Image();
    img.onload = () => {
      setImageLoading(false);
      setShowDefault(false);
    };
    img.onerror = () => {
      setImageLoading(false);
      setShowDefault(true);
    };
    img.src = loginPhoneImage;
  }, [loginPhoneImage]);

  return (
    <div className="signup-container">
      <div className="signup-wrapper">
        <div className="signup-phone">
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

        <div className="signup-form-container">
          <div className="signup-card">
            <div className="signup-logo">
              <img src={Logo1} alt="Logo" className="Signup-Logo--img" />
              <h1 className="signup-title">إنشاء حساب جديد</h1>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <input
                  type="text"
                  placeholder="الاسم الكامل"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
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
                  {showPassword ? <FiEyeOff/> : <FiEye/>}
                </button>
              </div>
              {passwordError && <div className="signup-error" style={{ background: '#fef3c7', color: '#92400e' }}>{passwordError}</div>}
              
              {/* حقل كود الإحالة */}
              <div className="input-group referral-group">
                <input
                  type="text"
                  placeholder="كود الإحالة (اختياري)"
                  value={referralCode}
                  onChange={handleReferralChange}
                  dir="ltr"
                  className="referral-input"
                />
                {referralError && <div className="signup-error referral-error">{referralError}</div>}
                {referralUser && !referralError && (
                  <div className="referral-success">
                    ✅ كود صحيح - المحيل: {referralUser.name || 'مستخدم'}
                  </div>
                )}
              </div>

              {error && <div className="signup-error">{error}</div>}
              <button type="submit" className="signup-submit" disabled={loading}>
                {loading ? 'جاري...' : 'إنشاء حساب'}
              </button>
            </form>

            <div className="signup-divider">
              <span className="divider-text">أو</span>
            </div>

            <div className="signup-footer">
              لديك حساب بالفعل؟{' '}
              <button type="button" className="switch-btn" onClick={() => navigate('/login')}>
                تسجيل الدخول
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="signup-footer-links">
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
      <div className="signup-copyright">© {new Date().getFullYear()} MarsGo من Meta</div>
    </div>
  );
}