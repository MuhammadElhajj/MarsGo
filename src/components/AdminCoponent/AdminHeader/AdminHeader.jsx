import { useAuth } from '../../../context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../../firebase';
import { Link } from 'react-router-dom';
import Avatar from '../../GeneralComponents/Avatar/Avatar';
import Button from '../../GeneralComponents/Button/Button';
import './AdminHeader.css';

export default function AdminHeader({ onToggleSidebar }) {
  const { userData } = useAuth();

  return (
    <header className="admin-header">
      <div className="admin-header__left">
        <button className="admin-header__hamburger" onClick={onToggleSidebar} aria-label="القائمة">
          <span className="hamburger-icon"></span>
          <span className="hamburger-icon"></span>
          <span className="hamburger-icon"></span>
        </button>
        <Link to="/dashboard" className="admin-header__back-link">← العودة للمتجر</Link>
        <h1 className="admin-header__title">لوحة الإدارة</h1>
      </div>
      <div className="admin-header__user">
        <Avatar src={userData?.avatar} email={userData?.email} name={userData?.name} size="md" />
        <span className="admin-header__name">{userData?.name}</span>
        <Button variant="danger" onClick={() => signOut(auth)} className="admin-header__logout">خروج</Button>
      </div>
    </header>
  );
}