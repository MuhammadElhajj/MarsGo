import { useNavigate } from 'react-router-dom';
import { FiCreditCard } from 'react-icons/fi';
import './PaymentButton.css';

export default function PaymentButton({ text = "ادفع هنا", variant = "primary", showIcon = true }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/payment-info');
  };

  return (
    <button className={`payment-btn ${variant}`} onClick={handleClick}>
      {showIcon && <FiCreditCard size={18} />}
      <span>{text}</span>
    </button>
  );
}