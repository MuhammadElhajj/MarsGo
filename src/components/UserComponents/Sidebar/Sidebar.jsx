import { useState, lazy, Suspense, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../../firebase";
import { useAuth } from "../../../context/AuthContext";
import { useAppStore } from "../../../store/store";
import Loading from "../../GeneralComponents/Loading/Loading";
import Avatar from "../../GeneralComponents/Avatar/Avatar";
import CurrencyToggle from "../../GeneralComponents/CurrencyToggle/CurrencyToggle";
import { FiSun, FiMoon, FiLogOut, FiShield, FiUsers, FiDollarSign } from "react-icons/fi";
import './Sidebar.css';

const SpendingProgress = lazy(() => import('../SpendingProgress/SpendingProgress'));
const ExchangeRateWidget = lazy(() => import("../../GeneralComponents/ExchangeRateWidget/ExchangeRateWidget"));

export default function Sidebar({ isOpen, onClose }) {
  const { userData } = useAuth();
  const location = useLocation();
  const [servicesOpen, setServicesOpen] = useState(true);
  
  const isDark = useAppStore((state) => state.isDark);
  const toggleTheme = useAppStore((state) => state.toggleTheme);

  // ✅ تطبيق الثيم على مستوى الصفحة عند تغيير isDark
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const linkClass = (path) =>
    `sidebar__link ${location.pathname === path ? "sidebar__link--active" : ""}`;

  const roleLinkClass = (path, roleType) =>
    `sidebar__link sidebar__link--${roleType} ${location.pathname === path ? "sidebar__link--active" : ""}`;

  const toggleServices = () => setServicesOpen(prev => !prev);

  const handleLinkClick = () => {
    if (window.innerWidth <= 768) onClose();
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
      <button className="sidebar__close-btn" onClick={onClose} aria-label="إغلاق القائمة">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M15 5L5 15M5 5l10 10" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      <div className="sidebar__scrollable">
        {/* كارد المستخدم */}
        <div className="sidebar__user-card">
          <div className="sidebar__user-avatar">
            <Avatar src={userData?.avatar} name={userData?.name} email={userData?.email} size="lg" />
          </div>
          <div className="sidebar__user-text">
            <h4 className="sidebar__user-name">{userData?.name || 'مستخدم'}</h4>
            <p className="sidebar__user-email">{userData?.email || ''}</p>
          </div>
        </div>

        {/* سعر الصرف */}
        <div className="sidebar__exchange-rate">
          <Suspense fallback={
            <div className="sidebar-skeleton">
              <div className="spinner-small"></div>
              <p>جاري تحميل السعر...</p>
            </div>
          }>
            <ExchangeRateWidget />
          </Suspense>
        </div>

        {/* تقدم الإنفاق */}
        <div className="sidebar__spending-progress">
          <Suspense fallback={
            <div className="sidebar-skeleton">
              <div className="spinner-small"></div>
              <p>جاري تحميل تقدمك...</p>
            </div>
          }>
            <SpendingProgress />
          </Suspense>
        </div>

        {/* تبديل العملة */}
        <div className="sidebar__currency-toggle">
          <CurrencyToggle showLabel={true} />
        </div>

        {/* القائمة الرئيسية */}
        <nav aria-label="القائمة الرئيسية">
          <ul className="sidebar__list">
            <li><Link to="/dashboard" className={linkClass("/dashboard")} onClick={handleLinkClick}>لوحة التحكم</Link></li>
            <li>
              <button className="sidebar__category-btn" onClick={toggleServices} aria-expanded={servicesOpen}>
                <span>الخدمات الرقمية</span>
                <svg className={`sidebar__chevron ${servicesOpen ? 'sidebar__chevron--open' : ''}`} width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
              {servicesOpen && (
                <ul className="sidebar__sublist">
                  <li><Link to="/gaming" className={linkClass("/gaming")} onClick={handleLinkClick}> شحن ألعاب</Link></li>
                  <li><Link to="/apps" className={linkClass("/apps")} onClick={handleLinkClick}> تطبيقات</Link></li>
                </ul>
              )}
            </li>
            <li><Link to="/profile" className={linkClass("/profile")} onClick={handleLinkClick}>ملفي الشخصي</Link></li>
            <li><Link to="/my-orders" className={linkClass("/my-orders")} onClick={handleLinkClick}>طلباتي</Link></li>
            <li><Link to="/about" className={linkClass("/about")} onClick={handleLinkClick}>من نحن</Link></li>
          </ul>
        </nav>
      </div>

      {/* الأزرار الثابتة في الأسفل (مع روابط الأدوار) */}
      <div className="sidebar__fixed-bottom">
        {userData?.role === "verifier" && (
          <Link to="/verifier" className={roleLinkClass("/verifier", "verifier")} onClick={handleLinkClick}>
            <FiShield className="sidebar__link-icon" /> لوحة التدقيق
          </Link>
        )}
        {userData?.role === "admin" && (
          <Link to="/admin" className={roleLinkClass("/admin", "admin")} onClick={handleLinkClick}>
            <FiUsers className="sidebar__link-icon" /> لوحة الإدارة
          </Link>
        )}
        {userData?.role === "finance_verifier" && (
          <Link to="/finance-verifier" className={roleLinkClass("/finance-verifier", "finance")} onClick={handleLinkClick}>
            <FiDollarSign className="sidebar__link-icon" /> تدقيق طلبات الشحن
          </Link>
        )}
        
        {/* <button className="sidebar__theme-btn" onClick={toggleTheme} aria-label="تبديل المظهر">
          {isDark ? <FiSun size={20} /> : <FiMoon size={20} />}
          <span>{isDark ? "الوضع الفاتح" : "الوضع الداكن"}</span>
        </button> */}
        <button className="sidebar__logout-btn" onClick={handleLogout} aria-label="تسجيل الخروج">
          <FiLogOut size={20} />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
}