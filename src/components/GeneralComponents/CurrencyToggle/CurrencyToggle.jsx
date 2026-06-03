import { useCurrency } from '../../../context/CurrencyContext';
import { FiDollarSign } from 'react-icons/fi';
import './CurrencyToggle.css';

export default function CurrencyToggle() {
  const { currency, toggleCurrency } = useCurrency();

  return (
    <button className="currency-toggle" onClick={toggleCurrency} aria-label="تبديل العملة">
      {currency === 'USD' ? (
        <FiDollarSign size={18} />
      ) : (
        <span className="currency-syp">ل.س</span>
      )}
    </button>
  );
}