// src/components/UserComponents/Header/Header.jsx
import { useAuth } from "../../../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../../../firebase";
import Avatar from "../../GeneralComponents/Avatar/Avatar";
import Search from "../../GeneralComponents/Search/Search";
import ThemeToggle from '../../GeneralComponents/ThemeToggle/ThemeToggle';
import { FiMenu, FiLogOut } from 'react-icons/fi';
import { useTheme } from '../../../context/ThemeContext';
import './Header.css';
import LogoDark from "../../../assets/logo-dark.png";
import LogoLight from "../../../assets/logo-light.png";
import CurrencyToggle from '../../GeneralComponents/CurrencyToggle/CurrencyToggle';
import NotificationBell from '../../GeneralComponents/NotificationBell/NotificationBell';

export default function Header({ onToggleSidebar }) {
  const { userData } = useAuth();
  const { isDark } = useTheme();
  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <header className="header">
      <div className="header__left">
        <button className="header__hamburger" onClick={onToggleSidebar} aria-label="القائمة">
          <FiMenu size={22} />
        </button>
        <img 
          src={isDark ? LogoDark : LogoLight} 
          alt="Logo" 
          className='header-Logo--img'
        />
      </div>
      <div className="header__center">
        <Search placeholder="ابحث عن طلب..." />
      </div>
      <div className="header__right">
        <div className="header__user">
          <NotificationBell />
          <div className="header__desktop-actions">
            <ThemeToggle />
            <button 
              className="header__logout-icon" 
              onClick={handleLogout}
              aria-label="تسجيل الخروج"
              title="تسجيل الخروج"
            >
              <FiLogOut size={18} />
            </button>
          </div>
          <span className="header__name">{userData?.name}</span>
          <Avatar
            src={userData?.avatar}
            alt={userData?.name}
            email={userData?.email}
            name={userData?.name}
            size="md"
          />
        </div>
      </div>
    </header>
  );
}