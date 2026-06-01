import { useAuth } from "../../../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../../../firebase";
import Avatar from "../../GeneralComponents/Avatar/Avatar";
import Search from "../../GeneralComponents/Search/Search";
import ThemeToggle from '../../GeneralComponents/ThemeToggle/ThemeToggle';
import { FiMenu, FiLogOut } from 'react-icons/fi';  // ✅ أيقونات React
import './Header.css';
import Logo from "../../../assets/logo-dark.png";


export default function Header({ onToggleSidebar }) {
  const { userData } = useAuth();

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <header className="header">
      <div className="header__left">
        {/* ✅ زر القائمة بأيقونة React بدلاً من الـ spans */}
        <button className="header__hamburger" onClick={onToggleSidebar} aria-label="القائمة">
          <FiMenu size={22} />
        </button>
         <img src={Logo} alt="Logo" className='header-Logo--img'/>
                     
         {/* <h1 className="header__brand">MarsGo</h1> */}
      </div>

      <div className="header__center">
        <Search placeholder="ابحث عن طلب..." />
      </div>

      <div className="header__right">
        <div className="header__user">
          <ThemeToggle />
          <Avatar
            src={userData?.avatar}
            alt={userData?.name}
            email={userData?.email}
            name={userData?.name}
            size="md"
          />
          <span className="header__name">{userData?.name}</span>
          <button 
            className="header__logout-icon" 
            onClick={handleLogout}
            aria-label="تسجيل الخروج"
            title="تسجيل الخروج"
          >
            <FiLogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}