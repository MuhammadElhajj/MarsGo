// src/components/UserComponents/PaymentMethods/PaymentMethods.jsx
import {
  FiLock,
  FiCreditCard,
} from 'react-icons/fi';
import {
  FaPaypal,
  FaGooglePay,
  FaCcMastercard,
  FaCcVisa,
} from 'react-icons/fa';
import { SiKlarna } from 'react-icons/si';
import './PaymentMethods.css';

export default function PaymentMethods() {
  const paymentMethods = [
    { name: 'PayPal', icon: <FaPaypal /> },
    { name: 'Google Pay', icon: <FaGooglePay /> },
    { name: 'Klarna', icon: <SiKlarna /> },
    { name: 'paysafecard', icon: <FiCreditCard /> },
    { name: 'MasterCard', icon: <FaCcMastercard /> },
    { name: 'Visa', icon: <FaCcVisa /> },
    { name: 'SecureCode', icon: <FiLock /> },
  ];

  return (
    <div className="payment-methods">
      {/* <h4 className="payment-methods__title">طرق الدفع المقبولة قريباً</h4> */}
      <div className="payment-methods__marquee">
        <div className="payment-methods__track">
          {paymentMethods.concat(paymentMethods).map((method, index) => (
            <span key={index} className="payment-methods__icon">
              {method.icon}
              <span className="payment-methods__name">{method.name}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}