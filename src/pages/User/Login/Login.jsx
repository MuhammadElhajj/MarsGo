import { useState, lazy, Suspense } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../../../firebase";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/GeneralComponents/Button/Button";
import Input from "../../../components/GeneralComponents/Input/Input";
import Loading from "../../../components/GeneralComponents/Loading/Loading";
import './Login.css';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err.code === "auth/email-already-in-use" ? "البريد مسجل مسبقاً" : "فشل العملية");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    const provider = new GoogleAuthProvider();
    setLoading(true);
    try {
      await signInWithPopup(auth, provider);
      navigate("/dashboard");
    } catch (err) {
      setError("فشل تسجيل الدخول بحساب Google");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container" dir="rtl">
      <div className="login-card">
        <h1 className="login-title">DevFix</h1>
        <form onSubmit={handleSubmit} className="login-form">
          {isRegister && (
            <Input
              label="الاسم الكامل"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}
          <Input
            label="البريد الإلكتروني"
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="كلمة المرور"
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          {error && <p className="login-error">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? "جاري..." : isRegister ? "إنشاء حساب" : "تسجيل الدخول"}
          </Button>
        </form>
        <div className="login-separator">أو</div>
        <Button variant="google" onClick={handleGoogle} disabled={loading}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.372 0 0 5.373 0 12s5.372 12 12 12c6.627 0 12-5.373 12-12S18.627 0 12 0zm.14 19.018c-3.868 0-7-3.14-7-7.018 0-3.878 3.132-7.018 7-7.018 1.89 0 3.47.696 4.682 1.836l-1.895 1.825c-.521-.5-1.426-1.08-2.787-1.08-2.385 0-4.332 1.977-4.332 4.437s1.947 4.437 4.332 4.437c2.77 0 3.8-1.99 3.96-3.02h-3.96v-2.46h6.59c.06.349.11.695.11 1.152 0 3.98-2.67 6.8-6.7 6.8z"/>
          </svg>
          متابعة بحساب Google
        </Button>
        <p className="login-switch">
          {isRegister ? "لديك حساب بالفعل؟" : "ليس لديك حساب؟"}{" "}
          <button
            type="button"
            className="login-switch-btn"
            onClick={() => setIsRegister(!isRegister)}
          >
            {isRegister ? "تسجيل الدخول" : "إنشاء حساب جديد"}
          </button>
        </p>
      </div>
    </div>
  );
}