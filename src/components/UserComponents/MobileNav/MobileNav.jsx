// src/components/UserComponents/MobileNav/MobileNav.jsx
import { NavLink } from "react-router-dom";
import { 
  FiHome, 
  FiMessageCircle, 
  FiUser, 
  FiAward, 
  FiBarChart2 
} from "react-icons/fi";
import './MobileNav.css';

export default function MobileNav() {
  const navItems = [
    { to: '/', icon: <FiHome />, label: 'الرئيسية' },
    { to: '/chat', icon: <FiMessageCircle />, label: 'دردشة' },
    { to: '/profile', icon: <FiUser />, label: 'حسابي' },
    { to: '/wheel', icon: <FiAward />, label: 'دولاب' },
    { to: '/leaderboard', icon: <FiBarChart2 />, label: 'المتصدرين' },
  ];

  return (
    <nav className="mobile-nav">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `mobile-nav__item ${isActive ? 'mobile-nav__item--active' : ''}`
          }
        >
          <span className="mobile-nav__icon">{item.icon}</span>
          <span className="mobile-nav__label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}