import { useAppStore } from '../../../store/store';
import './CurrencyToggle.css';

export default function CurrencyToggle({ className = '', showLabel = false }) {
  const currency = useAppStore((state) => state.currency);
  const toggleCurrency = useAppStore((state) => state.toggleCurrency);

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