

// import { useState, useEffect } from 'react';
// import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendEmailVerification } from 'firebase/auth';
// import { auth } from '../../../firebase';
// import { useNavigate } from 'react-router-dom';
// import { useStoreSettings } from '../../../context/StoreSettingsContext';
// import './Login.css';
// import Logo1 from "../../../assets/logo-light.png";

// // صورة افتراضية مدمجة (Base64)
// const DEFAULT_PHONE_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 350'%3E%3Crect width='200' height='350' fill='%234f46e5'/%3E%3Ccircle cx='100' cy='120' r='40' fill='%23ffffff' opacity='0.8'/%3E%3Crect x='60' y='180' width='80' height='10' rx='5' fill='%23ffffff' opacity='0.6'/%3E%3Crect x='50' y='210' width='100' height='10' rx='5' fill='%23ffffff' opacity='0.4'/%3E%3Crect x='70' y='240' width='60' height='10' rx='5' fill='%23ffffff' opacity='0.3'/%3E%3Ctext x='100' y='300' font-size='20' text-anchor='middle' fill='white' font-family='Arial'%3EMarsGo%3C/text%3E%3C/svg%3E";

// export default function Login() {
//   const { settings } = useStoreSettings();
//   const loginPhoneImage = settings?.loginPhoneImage;
//   const [imageLoading, setImageLoading] = useState(true);
//   const [imageError, setImageError] = useState(false);
//   const [showDefault, setShowDefault] = useState(false);
  
//   const [isRegister, setIsRegister] = useState(false);
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [name, setName] = useState('');
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [pendingVerificationEmail, setPendingVerificationEmail] = useState(''); // لتخزين البريد المرسل إليه رابط التفعيل
//   const navigate = useNavigate();

//   useEffect(() => {
//     if (!loginPhoneImage) {
//       setImageLoading(false);
//       setShowDefault(true);
//       return;
//     }
//     const img = new Image();
//     img.onload = () => {
//       setImageLoading(false);
//       setImageError(false);
//       setShowDefault(false);
//     };
//     img.onerror = () => {
//       setImageLoading(false);
//       setImageError(true);
//       setShowDefault(true);
//     };
//     img.src = loginPhoneImage;
//   }, [loginPhoneImage]);

//   // إعادة إرسال رابط التحقق
//   const resendVerificationEmail = async () => {
//     const user = auth.currentUser;
//     if (user && !user.emailVerified) {
//       await sendEmailVerification(user);
//       setError('✅ تم إعادة إرسال رابط التفعيل، تفقد بريدك الإلكتروني.');
//     } else if (pendingVerificationEmail) {
//       // حالة نادرة: حاول تسجيل الدخول لكن البريد غير مفعل ونريد إعادة الإرسال
//       // نحتاج إلى تسجيل الدخول مؤقتاً؟ الأسهل نطلب منه تسجيل الدخول مرة أخرى.
//       setError('الرجاء تسجيل الدخول أولاً ثم طلب إعادة الإرسال.');
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');
//     setLoading(true);
//     try {
//       if (isRegister) {
//         // 1. إنشاء الحساب
//         const userCredential = await createUserWithEmailAndPassword(auth, email, password);
//         // 2. إرسال رابط التحقق
//         await sendEmailVerification(userCredential.user);
//         // 3. عرض رسالة والتوقف عن التوجيه
//         setError('✅ تم إنشاء الحساب بنجاح. يرجى التحقق من بريدك الإلكتروني لتفعيل حسابك (قد تجده في spam).');
//         setPendingVerificationEmail(email);
//         setLoading(false);
//         return; // لا توجيه
//       } else {
//         // تسجيل الدخول
//         const userCredential = await signInWithEmailAndPassword(auth, email, password);
//         // التحقق من تفعيل البريد
//         if (!userCredential.user.emailVerified) {
//           await signOut(auth); // تسجيل خروج فوري
//           setError('❌ بريدك الإلكتروني غير مفعل. يرجى تفعيله أولاً (راجع بريدك).');
//           setPendingVerificationEmail(email);
//           setLoading(false);
//           return;
//         }
//         // كل شيء على ما يرام
//         navigate('/dashboard');
//       }
//     } catch (err) {
//       let msg = 'فشل العملية';
//       if (err.code === 'auth/email-already-in-use') msg = 'البريد مسجل مسبقاً';
//       else if (err.code === 'auth/user-not-found') msg = 'لا يوجد حساب بهذا البريد';
//       else if (err.code === 'auth/wrong-password') msg = 'كلمة المرور غير صحيحة';
//       else if (err.code === 'auth/too-many-requests') msg = 'محاولات كثيرة، حاول لاحقاً';
//       setError(msg);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleGoogle = async () => {
//     const provider = new GoogleAuthProvider();
//     setLoading(true);
//     try {
//       const result = await signInWithPopup(auth, provider);
//       // Google accounts عادة ما تكون مفعلة تلقائياً، لكن نتحقق احتياطاً
//       if (!result.user.emailVerified) {
//         await signOut(auth);
//         setError('❌ بريدك الإلكتروني غير مفعل (حساب Google). يرجى التحقق من بريدك.');
//         setLoading(false);
//         return;
//       }
//       navigate('/dashboard');
//     } catch (err) {
//       setError('فشل تسجيل الدخول بحساب Google');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="login-container">
//       <div className="login-wrapper">
//         {/* العمود الأيسر – صورة الهاتف */}
//         <div className="login-phone">
//           <div className="phone-mockup">
//             {loginPhoneImage && imageLoading && !showDefault && (
//               <div className="phone-loading">
//                 <div className="spinner-small"></div>
//               </div>
//             )}
//             {(!imageLoading || showDefault) && (
//               <img
//                 src={showDefault ? DEFAULT_PHONE_IMAGE : loginPhoneImage}
//                 alt="تطبيق MarsGo"
//                 className="phone-image"
//                 style={{ display: 'block' }}
//               />
//             )}
//           </div>
//         </div>

//         {/* العمود الأيمن – نموذج تسجيل الدخول */}
//         <div className="login-form-container">
//           <div className="login-card">
//             <div className="login-logo">
//               <img src={Logo1} alt="Logo" className='Login-Logo--img'/>
//               <h1 className="login-title">تسجيل الدخول</h1>
//             </div>

//             <form onSubmit={handleSubmit}>
//               {isRegister && (
//                 <div className="input-group">
//                   <input
//                     type="text"
//                     placeholder="الاسم الكامل"
//                     value={name}
//                     onChange={(e) => setName(e.target.value)}
//                     required
//                   />
//                 </div>
//               )}
//               <div className="input-group">
//                 <input
//                   type="email"
//                   placeholder="البريد الإلكتروني"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   required
//                 />
//               </div>
//               <div className="input-group">
//                 <input
//                   type="password"
//                   placeholder="كلمة المرور"
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   required
//                   minLength={6}
//                 />
//               </div>
//               {error && <div className="login-error">{error}</div>}
//               <button type="submit" className="login-submit" disabled={loading}>
//                 {loading ? 'جاري...' : isRegister ? 'إنشاء حساب' : 'تسجيل الدخول'}
//               </button>
//             </form>

//             {/* عرض زر إعادة الإرسال إذا كان هناك بريد معلق غير مفعل */}
//             {pendingVerificationEmail && error?.includes('غير مفعل') && (
//               <button onClick={resendVerificationEmail} className="login-submit" style={{ marginTop: '10px', background: '#f59e0b' }}>
//                 إعادة إرسال رابط التفعيل
//               </button>
//             )}

//             <div className="login-divider">
//               <span className="divider-text">أو</span>
//             </div>

//             <button
//               type="button"
//               onClick={handleGoogle}
//               disabled={loading}
//               className="google-login"
//             >
//               <svg className="google-login__icon" viewBox="0 0 24 24" width="20" height="20">
//                 <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
//                 <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
//                 <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
//                 <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
//               </svg>
//               <span>متابعة بحساب Google</span>
//             </button>

//             <div className="login-footer">
//               <a href="#" className="forgot-password">نسيت كلمة المرور؟</a>
//               <div className="signup-switch">
//                 {isRegister ? 'لديك حساب بالفعل؟' : 'ليس لديك حساب؟'}{' '}
//                 <button type="button" className="switch-btn" onClick={() => setIsRegister(!isRegister)}>
//                   {isRegister ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="login-footer-links">
//         <a href="#">Meta</a>
//         <a href="#">حول</a>
//         <a href="#">المدونة</a>
//         <a href="#">وظائف</a>
//         <a href="#">مساعدة</a>
//         <a href="#">API</a>
//         <a href="#">الخصوصية</a>
//         <a href="#">الشروط</a>
//         <a href="#">المواقع الشائعة</a>
//         <a href="#">Instagram Lite</a>
//         <a href="#">Threads</a>
//       </div>
//       <div className="login-copyright">© {new Date().getFullYear()} MarsGo من Meta</div>
//     </div>
//   );
// }


import { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { auth } from '../../../firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useNavigate } from 'react-router-dom';
import { useStoreSettings } from '../../../context/StoreSettingsContext';
import './Login.css';
import Logo1 from "../../../assets/logo-light.png";

// صورة افتراضية مدمجة (Base64)
const DEFAULT_PHONE_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 350'%3E%3Crect width='200' height='350' fill='%234f46e5'/%3E%3Ccircle cx='100' cy='120' r='40' fill='%23ffffff' opacity='0.8'/%3E%3Crect x='60' y='180' width='80' height='10' rx='5' fill='%23ffffff' opacity='0.6'/%3E%3Crect x='50' y='210' width='100' height='10' rx='5' fill='%23ffffff' opacity='0.4'/%3E%3Crect x='70' y='240' width='60' height='10' rx='5' fill='%23ffffff' opacity='0.3'/%3E%3Ctext x='100' y='300' font-size='20' text-anchor='middle' fill='white' font-family='Arial'%3EMarsGo%3C/text%3E%3C/svg%3E";

// دالة فحص قوة كلمة المرور
const isStrongPassword = (password) => {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return regex.test(password);
};

export default function Login() {
  const { settings } = useStoreSettings();
  const loginPhoneImage = settings?.loginPhoneImage;
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [showDefault, setShowDefault] = useState(false);
  
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const navigate = useNavigate();

  // تهيئة Functions (نفترض أنك قمت بنشرها)
  const functions = getFunctions();
  const sendVerificationCode = httpsCallable(functions, 'sendVerificationCode');
  const checkEmailVerified = httpsCallable(functions, 'checkEmailVerified');

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

  const handlePasswordChange = (e) => {
    const newPass = e.target.value;
    setPassword(newPass);
    if (isRegister && newPass && !isStrongPassword(newPass)) {
      setPasswordError('يجب أن تحتوي كلمة المرور على 8 محارف على الأقل، حرف كبير، حرف صغير، رقم، ورمز خاص (@$!%*?&)');
    } else {
      setPasswordError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isRegister) {
      // فحص قوة كلمة المرور قبل إنشاء الحساب
      if (!isStrongPassword(password)) {
        setError('كلمة المرور غير قوية. الرجاء اتباع المتطلبات المذكورة.');
        setLoading(false);
        return;
      }
      if (!name.trim()) {
        setError('الرجاء إدخال الاسم الكامل');
        setLoading(false);
        return;
      }

      try {
        // 1. إنشاء الحساب (البريد الإلكتروني سيظل غير مفعل)
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2. إرسال كود التفعيل عبر Cloud Function
        const result = await sendVerificationCode({ email: user.email, uid: user.uid });
        if (result.data.success) {
          // 3. تخزين البريد مؤقتاً (يمكن استخدام sessionStorage أو state)
          sessionStorage.setItem('pendingVerificationEmail', email);
          // 4. الانتقال إلى صفحة إدخال الكود
          navigate('/verify-code', { state: { email, uid: user.uid } });
        } else {
          throw new Error(result.data.message || 'فشل إرسال كود التفعيل');
        }
      } catch (err) {
        let msg = 'فشل إنشاء الحساب';
        if (err.code === 'auth/email-already-in-use') msg = 'البريد مسجل مسبقاً';
        else if (err.message) msg = err.message;
        setError(msg);
      } finally {
        setLoading(false);
      }
    } else {
      // تسجيل الدخول
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        // التحقق من حالة التفعيل عبر Firestore (باستخدام Cloud Function)
        const verResult = await checkEmailVerified({ uid: user.uid });
        if (verResult.data.verified) {
          navigate('/dashboard');
        } else {
          // لم يتم التفعيل بعد: إرسال كود جديد
          await sendVerificationCode({ email: user.email, uid: user.uid });
          navigate('/verify-code', { state: { email: user.email, uid: user.uid } });
        }
      } catch (err) {
        let msg = 'فشل تسجيل الدخول';
        if (err.code === 'auth/user-not-found') msg = 'لا يوجد حساب بهذا البريد';
        else if (err.code === 'auth/wrong-password') msg = 'كلمة المرور غير صحيحة';
        else if (err.code === 'auth/too-many-requests') msg = 'محاولات كثيرة، حاول لاحقاً';
        setError(msg);
        setLoading(false);
      }
    }
  };

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

  return (
    <div className="login-container">
      <div className="login-wrapper">
        {/* العمود الأيسر – صورة الهاتف */}
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

        {/* العمود الأيمن – نموذج تسجيل الدخول */}
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
              <div className="input-group">
                <input
                  type="password"
                  placeholder="كلمة المرور"
                  value={password}
                  onChange={handlePasswordChange}
                  required
                />
              </div>
              {passwordError && <div className="login-error" style={{background: '#fef3c7', color: '#92400e'}}>{passwordError}</div>}
              {error && <div className="login-error">{error}</div>}
              <button type="submit" className="login-submit" disabled={loading}>
                {loading ? 'جاري...' : isRegister ? 'إنشاء حساب' : 'تسجيل الدخول'}
              </button>
            </form>

            {/* تم إزالة زر إعادة الإرسال القديم لأنه لم يعد مستخدماً */}
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