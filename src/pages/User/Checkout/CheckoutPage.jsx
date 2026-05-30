import { useNavigate } from 'react-router-dom';
import { FiCreditCard } from 'react-icons/fi';

export default function CheckoutPage() {
  const navigate = useNavigate();

  // ... باقي الكود

  return (
    <div>
      {/* ... */}
      <button 
        className="btn btn-outline" 
        onClick={() => navigate('/payment-info')}
      >
        <FiCreditCard /> ادفع هنا
      </button>
      {/* ... */}
    </div>
  );
}