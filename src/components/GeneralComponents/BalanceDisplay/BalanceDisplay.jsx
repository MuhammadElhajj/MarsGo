// src/components/GeneralComponents/BalanceDisplay/BalanceDisplay.jsx
import { useBalance } from '../../../context/BalanceContext';
import { useCurrency } from '../../../context/CurrencyContext';
import { useExchangeRate } from '../../../context/ExchangeRateContext';
import './BalanceDisplay.css';

export default function BalanceDisplay({ 
  showIcon = true, 
  className = '', 
  showLoading = true,
  compact = false 
}) {
  const { balance, loading } = useBalance();
  const { currency } = useCurrency();
  const { rate } = useExchangeRate();

  if (loading && showLoading) {
    return <div className={`balance-display balance-display--loading ${className}`}>...</div>;
  }

  // حساب القيمة المعروضة حسب العملة
  let displayValue, displayCurrency;
  if (currency === 'USD') {
    displayValue = balance.toFixed(2);
    displayCurrency = 'دولار امريكي';
  } else {
    if (!rate) {
      displayValue = balance.toFixed(2);
      displayCurrency = '$ (سعر الصرف غير متاح)';
    } else {
      // التقريب لأعلى (Ceil) لأقرب ليرة
      const sypValue = Math.ceil(balance * rate);
      displayValue = sypValue.toLocaleString();
      displayCurrency = 'ليرة سورية جديدة';
    }
  }

  return (
    <div className={`balance-display ${compact ? 'balance-display--compact' : ''} ${className}`}>
      <span className="balance-display__amount">
        {displayValue} {displayCurrency}
      </span>
    </div>
  );
}