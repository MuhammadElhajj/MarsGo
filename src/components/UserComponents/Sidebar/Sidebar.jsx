import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import './Sidebar.css';

export default function Sidebar({ isOpen, onClose }) {
  const { userData } = useAuth();
  const location = useLocation();
  // const [servicesOpen, setServicesOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(true);

  const linkClass = (path) =>
    `sidebar__link ${location.pathname === path ? "sidebar__link--active" : ""}`;

  const toggleServices = () => setServicesOpen(prev => !prev);

  const handleLinkClick = () => {
    if (window.innerWidth <= 768) {
      onClose();
    }
  };

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
      {/* زر الإغلاق - يظهر فقط على الجوال */}
      <button className="sidebar__close-btn" onClick={onClose} aria-label="إغلاق القائمة">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M15 5L5 15M5 5l10 10" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      <nav>
        <ul className="sidebar__list">
          <li>
            <Link to="/dashboard" className={linkClass("/dashboard")} onClick={handleLinkClick}>
              لوحة التحكم
            </Link>
          </li>
          <li>
            <button
              className="sidebar__category-btn"
              onClick={toggleServices}
            >
              <span>الخدمات الرقمية</span>
              <svg
                className={`sidebar__chevron ${servicesOpen ? 'sidebar__chevron--open' : ''}`}
                width="16" height="16" viewBox="0 0 16 16"
              >
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              </svg>
            </button>
            {servicesOpen && (
              <ul className="sidebar__sublist">
                <li><Link to="/crypto" className={linkClass("/crypto")} onClick={handleLinkClick}>عملات رقمية</Link></li>
                <li><Link to="/gaming" className={linkClass("/gaming")} onClick={handleLinkClick}>شحن ألعاب</Link></li>
             
                <li><Link to="/transfer" className={linkClass("/transfer")} onClick={handleLinkClick}>تحويل دولي</Link></li>
                <li><Link to="/exchange" className={linkClass("/exchange")} onClick={handleLinkClick}>صرافة شام كاش</Link></li>
              </ul>
            )}
          </li>
          <li>
            <Link to="/my-orders" className={linkClass("/my-orders")} onClick={handleLinkClick}>
     طلباتي
  </Link>
</li> 
          <li>
            <Link to="/about" className={linkClass("/about")} onClick={handleLinkClick}>
              من نحن
            </Link>
          </li>
          {userData?.role === "verifier" && (
            <li>
              <Link to="/verifier" className={`${linkClass("/verifier")} sidebar__link--verifier`} onClick={handleLinkClick}>
                {/* <span className="sidebar__icon">🔍</span> */}
                لوحة التدقيق
              </Link>
            </li>
          )}
          {userData?.role === "admin" && (
            <li>
              <Link to="/admin" className={`${linkClass("/admin")} sidebar__link--admin`} onClick={handleLinkClick}>
                {/* <span className="sidebar__icon">⚙️</span> */}
                لوحة الإدارة
              </Link>
            </li>
          )}
        </ul>
      </nav>
    </aside>
  );
}