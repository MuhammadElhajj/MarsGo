import { useAuth } from '../../../context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../../firebase';
import { Link } from 'react-router-dom';
import Avatar from '../../GeneralComponents/Avatar/Avatar';
import Button from '../../GeneralComponents/Button/Button';
import './VerifierHeader.css';

export default function VerifierHeader() {
  const { userData } = useAuth();

  return (
    <header className="verifier-header">
      <div className="verifier-header__left">
        <Link to="/dashboard" className="verifier-header__back-link">
          ← العودة للمتجر
        </Link>
        <h1 className="verifier-header__title">لوحة التدقيق</h1>
      </div>
      <div className="verifier-header__user">
        <Avatar
          src={userData?.avatar}
          email={userData?.email}
          name={userData?.name}
          size="md"
        />
        <span className="verifier-header__name">{userData?.name}</span>
        <Button variant="danger" onClick={() => signOut(auth)} className="verifier-header__logout">
          خروج
        </Button>
      </div>
    </header>
  );
}