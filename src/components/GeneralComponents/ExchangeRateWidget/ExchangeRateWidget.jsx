import { useExchangeRate } from '../../../context/ExchangeRateContext';
import './ExchangeRateWidget.css';

export default function ExchangeRateWidget() {
  const { rate, loading } = useExchangeRate();

  if (loading) return <div className="exchange-rate-widget loading">جاري التحميل...</div>;
  if (!rate) return null;

  return (
    <div className="exchange-rate-widget">
      <div className="exchange-rate-widget__icon">💵</div>
      <div className="exchange-rate-widget__info">
        <span className="exchange-rate-widget__label">سعر الصرف </span>
        <span className="exchange-rate-widget__value">{rate.toLocaleString()} ل.س</span>
      </div>
    </div>
  );
}