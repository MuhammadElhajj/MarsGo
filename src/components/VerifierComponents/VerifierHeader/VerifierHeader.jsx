import { useAuth } from '../../../context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../../firebase';
import { Link } from 'react-router-dom';
import { FiMenu, FiLogOut } from 'react-icons/fi';
import Avatar from '../../GeneralComponents/Avatar/Avatar';
import ThemeToggle from '../../GeneralComponents/ThemeToggle/ThemeToggle';
import './VerifierHeader.css';

export default function VerifierHeader({ onToggleSidebar }) {
  const { userData } = useAuth();

  return (
    <header className="verifier-header">
      <div className="verifier-header__left">
        {/* زر القائمة للجوال */}
        <button className="verifier-header__hamburger" onClick={onToggleSidebar} aria-label="القائمة">
          <FiMenu size={22} />
        </button>
        <Link to="/dashboard" className="verifier-header__back-link">
          ← العودة للمتجر
        </Link>
        <h1 className="verifier-header__title">لوحة التدقيق</h1>
      </div>
      <div className="verifier-header__user">
        <ThemeToggle />
        <Avatar
          src={userData?.avatar}
          email={userData?.email}
          name={userData?.name}
          size="md"
        />
        <span className="verifier-header__name">{userData?.name}</span>
        <button 
          className="verifier-header__logout-icon" 
          onClick={() => signOut(auth)} 
          aria-label="تسجيل الخروج"
          title="تسجيل الخروج"
        >
          <FiLogOut size={18} />
        </button>
      </div>
    </header>
  );
}