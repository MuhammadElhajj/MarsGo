import { useAppStore } from '../../../store/store';
import './ExchangeRateWidget.css';

export default function ExchangeRateWidget() {
  const exchangeRate = useAppStore((state) => state.exchangeRate);
  // يمكن إضافة حالة تحميل في الـ store إذا أردت، حالياً نعتبر أن القيمة موجودة أو لا
  const loading = exchangeRate === null || exchangeRate === undefined;

  if (loading) return <div className="exchange-rate-widget loading">جاري التحميل...</div>;
  if (!exchangeRate) return null;

  return (
    <div className="exchange-rate-widget">
      <div className="exchange-rate-widget__icon">💵</div>
      <div className="exchange-rate-widget__info">
        <span className="exchange-rate-widget__label">سعر الصرف</span>
        <span className="exchange-rate-widget__value">{exchangeRate.toLocaleString()} ل.س</span>
      </div>
      <span className="live-dot live-indicator"></span>
    </div>
  );
}