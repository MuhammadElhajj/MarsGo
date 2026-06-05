// src/components/GeneralComponents/CurrencyToggle/CurrencyToggle.jsx
import { useCurrency } from '../../../context/CurrencyContext';
import { FiDollarSign, FiTrendingUp } from 'react-icons/fi';
import './CurrencyToggle.css';

export default function CurrencyToggle({ className = '', showLabel = false }) {
  const { currency, toggleCurrency } = useCurrency();

  return (
    <button
      className={`currency-toggle ${className}`}
      onClick={toggleCurrency}
      aria-label={`تحويل العملة إلى ${currency === 'USD' ? 'ليرة سورية' : 'دولار أمريكي'}`}
      title={`العملة الحالية: ${currency === 'USD' ? 'دولار أمريكي' : 'ليرة سورية'}`}
    >
      {currency === 'USD' ? (
        <>
           <span className="currency-syp-icon">دولار امريكي</span>
          {showLabel && <span>USD</span>}
        </>
      ) : (
        <>
          <span className="currency-syp-icon">ليرة سورية</span>
          {showLabel && <span>SYP</span>}
        </>
      )}
    </button>
  );
}