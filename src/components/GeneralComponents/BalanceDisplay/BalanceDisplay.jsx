// src/components/GeneralComponents/BalanceDisplay/BalanceDisplay.jsx
import { useAppStore } from '../../../store/store';
import './BalanceDisplay.css';

export default function BalanceDisplay({ 
  showIcon = true, 
  className = '', 
  showLoading = true,
  compact = false 
}) {
  const balance = useAppStore((state) => state.balance);
  const currency = useAppStore((state) => state.currency);
  const exchangeRate = useAppStore((state) => state.exchangeRate);
  
  // يمكنك إضافة حالة تحميل إذا كنت تريدها في store.js، حالياً نعتبر أنها دائماً جاهزة
  const loading = false; 

  if (loading && showLoading) {
    return <div className={`balance-display balance-display--loading ${className}`}>...</div>;
  }

  let displayValue, displayCurrency;
  if (currency === 'USD') {
    displayValue = balance.toFixed(2);
    displayCurrency = 'دولار امريكي';
  } else {
    if (!exchangeRate) {
      displayValue = balance.toFixed(2);
      displayCurrency = '$ (سعر الصرف غير متاح)';
    } else {
      const sypValue = Math.ceil(balance * exchangeRate);
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