import { useNavigate } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi'; // أيقونة سهم
import './GoBackButton.css';

export default function GoBackButton({ text = "رجوع", className = "", icon = true, onClick }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick(); // إذا أردت تنفيذ شيء إضافي قبل الرجوع
    } else {
      navigate(-1); // الرجوع للصفحة السابقة
    }
  };

  return (
    <button className={`go-back-btn ${className}`} onClick={handleClick}>
      {icon && <FiArrowRight className="go-back-icon" />}
      <span>{text}</span>
    </button>
  );
}