import { Link, useLocation } from 'react-router-dom';
import './AdminSidebar.css';

export default function AdminSidebar({ isOpen, onClose }) {
  const location = useLocation();
  const linkClass = (path) => `admin-sidebar__link ${location.pathname === path ? 'admin-sidebar__link--active' : ''}`;
  const handleLinkClick = () => { if (window.innerWidth <= 768) onClose(); };

  return (
    <aside className={`admin-sidebar ${isOpen ? 'admin-sidebar--open' : ''}`}>
      <button className="admin-sidebar__close-btn" onClick={onClose}>✕</button>
      <nav>
        <ul className="admin-sidebar__list">
          <li><Link to="/admin" className={linkClass('/admin')} onClick={handleLinkClick}>📊 لوحة التحكم</Link></li>
          <li><Link to="/admin/orders" className={linkClass('/admin/orders')} onClick={handleLinkClick}>📋 إدارة الطلبات</Link></li>
          <li><Link to="/admin/users" className={linkClass('/admin/users')} onClick={handleLinkClick}>👥 إدارة المستخدمين</Link></li>
      <li><Link to="/admin/payment-settings" className={linkClass('/admin/payment-settings')}>💳 إعدادات الدفع</Link></li>
      <li><Link to="/admin/games" className={linkClass('/admin/games')} onClick={handleLinkClick}>🎮 إدارة الألعاب</Link></li>
          <li><Link to="/admin/ads" className={linkClass('/admin/ads')} onClick={handleLinkClick}>📢 إدارة الإعلانات</Link></li>
          <li><Link to="/admin/services" className={linkClass('/admin/services')} onClick={handleLinkClick}>🔧 إدارة الخدمات</Link></li>
        
        <li><Link to="/admin/navigation" className={linkClass('/admin/navigation')} onClick={handleLinkClick}>🌐 روابط التنقل</Link></li>  <li><Link to="/admin/store-settings" className={linkClass('/admin/store-settings')} onClick={handleLinkClick}>🎨 إعدادات المتجر</Link></li>
          <li><Link to="/admin/settings" className={linkClass('/admin/settings')} onClick={handleLinkClick}>⚙️ الإعدادات</Link></li>
        </ul>
      </nav>
    </aside>
  );
}