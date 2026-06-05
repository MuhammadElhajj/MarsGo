import { useNavigate } from 'react-router-dom';
import { FiPlusCircle } from 'react-icons/fi';
import './TopUpButton.css';

export default function TopUpButton({ className = '' }) {
  const navigate = useNavigate();

  return (
    <button className={`topup-btn ${className}`} onClick={() => navigate('/TopUpPage ')}>
      <FiPlusCircle size={18} />
      <span>شحن الرصيد</span>
    </button>
  );
}