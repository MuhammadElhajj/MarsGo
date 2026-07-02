import { NavLink, Link } from "react-router-dom";
import { 
  FiHome, 
  FiMessageCircle, 
  FiUser, 
  FiAward, 
  FiBarChart2,
  FiSearch
} from "react-icons/fi";
import AdSpace from "../../UserComponents/AdSpace/AdSpace";
import './SecondarySidebar.css';

export default function SecondarySidebar({ isOpen, onClose }) {
  const navItems = [
    { to: '/', icon: <FiHome />, label: 'داشبورد' },
    { to: '/chat', icon: <FiMessageCircle />, label: 'دردشة جماعية' },
    { to: '/profile', icon: <FiUser />, label: 'بروفايل' },
    { to: '/wheel', icon: <FiAward />, label: 'دولاب' },
    { to: '/leaderboard', icon: <FiBarChart2 />, label: 'المتصدرين' },
  ];

  return (
    <>
      {isOpen && <div className="secondary-sidebar-overlay" onClick={onClose}></div>}
      <aside className={`secondary-sidebar ${isOpen ? 'secondary-sidebar--open' : ''}`}>
        {/* زر البحث في الأعلى */}
        <div className="secondary-sidebar__search">
          <Link to="/search" className="secondary-sidebar__search-link" onClick={onClose}>
            <FiSearch className="secondary-sidebar__search-icon" />
            <span className="secondary-sidebar__label">بحث</span>
          </Link>
        </div>

        {/* القائمة الرئيسية */}
        <div className="secondary-sidebar__scrollable">
          <nav className="secondary-sidebar__nav">
            <ul className="secondary-sidebar__menu">
              {navItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `secondary-sidebar__link ${isActive ? 'secondary-sidebar__link--active' : ''}`
                    }
                    onClick={onClose}
                  >
                    <span className="secondary-sidebar__icon">{item.icon}</span>
                    <span className="secondary-sidebar__label">{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* القسم الثابت في الأسفل (مساحة إعلانية) */}
        <div className="secondary-sidebar__fixed-bottom">
          <div className="secondary-sidebar__ad-wrapper">
            <AdSpace />
          </div>
        </div>
      </aside>
    </>
  );
}