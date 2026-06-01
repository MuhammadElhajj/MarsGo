import { Link, useLocation } from 'react-router-dom';
import './VerifierSidebar.css';

export default function VerifierSidebar({ isOpen, onClose }) {
  const location = useLocation();

  const linkClass = (path) =>
    `verifier-sidebar__link ${location.pathname === path ? 'verifier-sidebar__link--active' : ''}`;

  const handleLinkClick = () => {
    if (window.innerWidth <= 768) onClose();
  };

  return (
    <aside className={`verifier-sidebar ${isOpen ? 'verifier-sidebar--open' : ''}`}>
      <button className="verifier-sidebar__close-btn" onClick={onClose} aria-label="إغلاق القائمة">
        ✕
      </button>
      <nav>
        <ul className="verifier-sidebar__list">
          <li>
            <Link to="/verifier" className={linkClass('/verifier')} onClick={handleLinkClick}>
              <span className="verifier-sidebar__icon">📊</span>
              لوحة التحكم
            </Link>
          </li>
          <li>
            <Link to="/verifier/orders" className={linkClass('/verifier/orders')} onClick={handleLinkClick}>
              <span className="verifier-sidebar__icon">🔍</span>
              تدقيق الطلبات
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
}