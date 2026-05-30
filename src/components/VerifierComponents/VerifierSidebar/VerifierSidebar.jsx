import { Link, useLocation } from 'react-router-dom';
import './VerifierSidebar.css';

export default function VerifierSidebar() {
  const location = useLocation();

  const linkClass = (path) =>
    `verifier-sidebar__link ${location.pathname === path ? 'verifier-sidebar__link--active' : ''}`;

  return (
    <aside className="verifier-sidebar">
      <nav>
        <ul className="verifier-sidebar__list">
          <li>
            <Link to="/verifier" className={linkClass('/verifier')}>
              <span className="verifier-sidebar__icon">📊</span>
              لوحة التحكم
            </Link>
          </li>
          <li>
            <Link to="/verifier/orders" className={linkClass('/verifier/orders')}>
              <span className="verifier-sidebar__icon">🔍</span>
              تدقيق الطلبات
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
}