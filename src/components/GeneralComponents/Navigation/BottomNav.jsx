import { NavLink } from 'react-router-dom';
import { useAppStore } from '../../store/useStore';   // ← أضف هذا الاستيراد
import styles from './BottomNav.css';

const BottomNav = () => {
  const pendingCount = useAppStore(state => state.pendingRequestsCount);  // ← العدد الحي

  return (
    <nav className={styles.bottomNav}>
      <NavLink to="/" className={styles.navItem}>الرئيسية</NavLink>
      <NavLink to="/games" className={styles.navItem}>الألعاب</NavLink>

      {/* رابط الأصدقاء مع الشارة */}
      <NavLink to="/friends" className={styles.navItem}>
        الأصدقاء
        {pendingCount > 0 && (
          <span className={styles.badge}>{pendingCount}</span>
        )}
      </NavLink>

      <NavLink to="/profile" className={styles.navItem}>الملف</NavLink>
    </nav>
  );
};