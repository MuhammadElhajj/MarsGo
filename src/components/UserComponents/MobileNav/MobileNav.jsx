// src/components/UserComponents/MobileNav/MobileNav.jsx
import { NavLink } from "react-router-dom";
import { 
  FiHome, 
  FiSend, 
  FiSearch, 
  FiBarChart2 
} from "react-icons/fi";
import { useAuth } from "../../../context/AuthContext";
import Avatar from "../../GeneralComponents/Avatar/Avatar";
import './MobileNav.css';

export default function MobileNav() {
  const { userData } = useAuth();

  const navItems = [
    { to: '/', icon: <FiHome />, label: 'الرئيسية' },
    { to: '/chat', icon: <FiSend />, label: 'دردشة' },
    { to: '/search', icon: <FiSearch />, label: 'بحث' },
    { to: '/leaderboard', icon: <FiBarChart2 />, label: 'المتصدرين' },
    { 
      to: '/profile', 
      icon: <Avatar 
        src={userData?.avatar} 
        name={userData?.name} 
        email={userData?.email} 
        size="sm" 
        className="mobile-nav__avatar"
      />, 
      label: 'حسابي',
      isAvatar: true 
    },
  ];

  return (
    <nav className="mobile-nav">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `mobile-nav__item ${isActive ? 'mobile-nav__item--active' : ''} ${item.isAvatar ? 'mobile-nav__item--avatar' : ''}`
          }
        >
          <span className="mobile-nav__icon">{item.icon}</span>
          <span className="mobile-nav__label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}