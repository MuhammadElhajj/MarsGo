import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../../firebase';
import Avatar from '../../GeneralComponents/Avatar/Avatar';
import Button from '../../GeneralComponents/Button/Button';
import GoBackButton from '../../GeneralComponents/GoBackButton/GoBackButton'; // استيراد زر الرجوع
import './AdminHeader.css';

export default function AdminHeader({ onToggleSidebar }) {
  const { userData } = useAuth();
  const navigate = useNavigate();

  const handleGoToStore = () => {
    navigate('/dashboard');
  };

  return (
    <header className="admin-header">
      <div className="admin-header__left">
        <button className="admin-header__hamburger" onClick={onToggleSidebar} aria-label="القائمة">
          <span className="hamburger-icon"></span>
          <span className="hamburger-icon"></span>
          <span className="hamburger-icon"></span>
        </button>

        {/* استخدام مكون GoBackButton بدلاً من الرابط العادي */}
        <GoBackButton 
          text="العودة للمتجر" 
          onClick={handleGoToStore}
          className="admin-header__back-link"
        />

        <h1 className="admin-header__title">لوحة الإدارة</h1>
      </div>

      <div className="admin-header__user">
        <Avatar src={userData?.avatar} email={userData?.email} name={userData?.name} size="md" />
        <span className="admin-header__name">{userData?.name}</span>
        <Button variant="danger" onClick={() => signOut(auth)} className="admin-header__logout">
          خروج
        </Button>
      </div>
    </header>
  );
}