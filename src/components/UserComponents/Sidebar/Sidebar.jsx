import { useState, lazy, Suspense } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import Loading from "../../GeneralComponents/Loading/Loading";
import Avatar from "../../GeneralComponents/Avatar/Avatar";
import CurrencyToggle from "../../GeneralComponents/CurrencyToggle/CurrencyToggle";
import './Sidebar.css';

const SpendingProgress = lazy(() => import('../SpendingProgress/SpendingProgress'));
const ExchangeRateWidget = lazy(() => import("../../GeneralComponents/ExchangeRateWidget/ExchangeRateWidget"));

export default function Sidebar({ isOpen, onClose }) {
  const { userData } = useAuth();
  const location = useLocation();
  const [servicesOpen, setServicesOpen] = useState(true);

  const linkClass = (path) =>
    `sidebar__link ${location.pathname === path ? "sidebar__link--active" : ""}`;

  const toggleServices = () => setServicesOpen(prev => !prev);

  const handleLinkClick = () => {
    if (window.innerWidth <= 768) onClose();
  };

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
      <button className="sidebar__close-btn" onClick={onClose} aria-label="إغلاق القائمة">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M15 5L5 15M5 5l10 10" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      <div className="sidebar__user-card">
        <div className="sidebar__user-avatar">
          <Avatar src={userData?.avatar} name={userData?.name} email={userData?.email} size="lg" />
        </div>
        <div className="sidebar__user-text">
          <h4 className="sidebar__user-name">{userData?.name || 'مستخدم'}</h4>
          <p className="sidebar__user-email">{userData?.email || ''}</p>
        </div>
      </div>

      <div className="sidebar__exchange-rate">
        <Suspense fallback={<div className="exchange-rate-widget loading">جاري التحميل...</div>}>
          <ExchangeRateWidget />
        </Suspense>
      </div>

      <div className="sidebar__spending-progress">
        <Suspense fallback={<Loading text="جاري تحميل التقدم..." />}>
          <SpendingProgress />
        </Suspense>
      </div>

      <div className="sidebar__currency-toggle">
        <CurrencyToggle showLabel={true} />
      </div>

      <nav aria-label="القائمة الرئيسية">
        <ul className="sidebar__list">
          <li><Link to="/dashboard" className={linkClass("/dashboard")} onClick={handleLinkClick}>لوحة التحكم</Link></li>
          <li>
            <button 
              className="sidebar__category-btn" 
              onClick={toggleServices}
              aria-expanded={servicesOpen}
              aria-label="الخدمات الرقمية (قابلة للطي)"
              aria-controls="services-sublist"
            >
              <span>الخدمات الرقمية</span>
              <svg className={`sidebar__chevron ${servicesOpen ? 'sidebar__chevron--open' : ''}`} width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              </svg>
            </button>
            {servicesOpen && (
              <ul id="services-sublist" className="sidebar__sublist">
                <li><Link to="/gaming" className={linkClass("/gaming")} onClick={handleLinkClick}>شحن ألعاب</Link></li>
                <li><Link to="/apps" className={linkClass("/apps")} onClick={handleLinkClick}>تطبيقات</Link></li>
              </ul>
            )}
          </li>
          <li><Link to="/profile" className={linkClass("/profile")} onClick={handleLinkClick}>ملفي الشخصي</Link></li>
          <li><Link to="/my-orders" className={linkClass("/my-orders")} onClick={handleLinkClick}>طلباتي</Link></li>
          <li><Link to="/about" className={linkClass("/about")} onClick={handleLinkClick}>من نحن</Link></li>
          {userData?.role === "verifier" && (
            <li><Link to="/verifier" className={`${linkClass("/verifier")} sidebar__link--verifier`} onClick={handleLinkClick}>لوحة التدقيق</Link></li>
          )}
          {userData?.role === "admin" && (
            <li><Link to="/admin" className={`${linkClass("/admin")} sidebar__link--admin`} onClick={handleLinkClick}>لوحة الإدارة</Link></li>
          )}
          {userData?.role === "finance_verifier" && (
            <li><Link to="/finance-verifier" className={linkClass("/finance-verifier")} onClick={handleLinkClick}>💰 تدقيق طلبات الشحن</Link></li>
          )}
        </ul>
      </nav>
    </aside>
  );
}