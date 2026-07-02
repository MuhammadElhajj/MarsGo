// ExchangeRateCard.jsx
import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../../store/store';
import { FiDollarSign, FiTrendingUp, FiTrendingDown, FiRefreshCw } from 'react-icons/fi';
import './ExchangeRateCard.css';

export default function ExchangeRateCard() {
  const exchangeRate = useAppStore((state) => state.exchangeRate);
  const [loading, setLoading] = useState(true);
  const [dailyChange, setDailyChange] = useState({ value: 0, percent: 0, direction: 'up' });
  const [currentRate, setCurrentRate] = useState(exchangeRate);
  const previousRate = useRef(exchangeRate);
  const [updateTime, setUpdateTime] = useState(new Date());

  // دالة محاكاة للحصول على تحديث فعلي (لنفترض أن الـ store لديه دالة updateExchangeRate)
  // سنستخدم useEffect مع interval لجلب سعر جديد كل 10 ثوانٍ (محاكاة)
  useEffect(() => {
    if (!exchangeRate) {
      setLoading(true);
      return;
    }

    // تحديث السعر الحالي
    if (previousRate.current && previousRate.current !== exchangeRate) {
      const diff = exchangeRate - previousRate.current;
      const percent = (diff / previousRate.current) * 100;
      setDailyChange({
        value: diff,
        percent: parseFloat(percent.toFixed(2)),
        direction: diff >= 0 ? 'up' : 'down',
      });
    }
    previousRate.current = exchangeRate;
    setCurrentRate(exchangeRate);
    setUpdateTime(new Date());
    setLoading(false);

    // محاكاة تحديث السعر كل 10 ثوانٍ (لو كانت دالة تحديث في الـ store)
    // هنا نفترض أننا نستدعي دالة تحديث من الـ store (غير موجودة حالياً)
    // لكن سنضيف مؤقت لتحديث الـ date فقط كتجربة
    const interval = setInterval(() => {
      // لو كان لدينا دالة تحديث في الـ store نستدعيها هنا
      // لكن الآن سنقوم فقط بتحديث الوقت
      setUpdateTime(new Date());
    }, 10000);

    return () => clearInterval(interval);
  }, [exchangeRate]);

  if (loading || !currentRate) {
    return (
      <div className="exchange-rate-card loading">
        <div className="exchange-rate-card__spinner"></div>
        <span>جاري تحميل السعر...</span>
      </div>
    );
  }

  const formattedRate = currentRate.toLocaleString();
  const buyRate = (currentRate * 0.995).toFixed(0);
  const sellRate = (currentRate * 1.005).toFixed(0);
  const formattedTime = updateTime.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="exchange-rate-card">
      <div className="exchange-rate-card__header">
        <div className="exchange-rate-card__title">
          <FiDollarSign className="exchange-rate-card__icon" />
          <span>سعر الصرف</span>
          <span className="exchange-rate-card__pair">USD/SYP</span>
        </div>
        <div className="exchange-rate-card__live">
          <span className="live-dot"></span>
          <span>مباشر</span>
        </div>
      </div>

      <div className="exchange-rate-card__body">
        <div className="exchange-rate-card__rate">
          <span className="exchange-rate-card__currency">$</span>
          <span className="exchange-rate-card__value">{formattedRate}</span>
          <span className="exchange-rate-card__currency-label">ل.س</span>
        </div>

        <div className="exchange-rate-card__change">
          <span className={`change-badge ${dailyChange.direction === 'up' ? 'up' : 'down'}`}>
            {dailyChange.direction === 'up' ? <FiTrendingUp /> : <FiTrendingDown />}
            {dailyChange.direction === 'up' ? '+' : ''}{dailyChange.percent}%
          </span>
          <span className="change-label">اليوم</span>
        </div>
      </div>

      <div className="exchange-rate-card__spread">
        <div className="spread-item buy">
          <span className="spread-label">شراء</span>
          <span className="spread-value">{buyRate}</span>
        </div>
        <div className="spread-item sell">
          <span className="spread-label">بيع</span>
          <span className="spread-value">{sellRate}</span>
        </div>
        <div className="spread-item spread">
          <span className="spread-label">الفارق</span>
          <span className="spread-value">{(currentRate * 0.01).toFixed(0)}</span>
        </div>
      </div>

      <div className="exchange-rate-card__footer">
        <div className="exchange-rate-card__update">
          <span>آخر تحديث</span>
          <strong>{formattedTime}</strong>
        </div>
        <div className="exchange-rate-card__range">
          <span>أعلى: {(currentRate * 1.005).toFixed(0)}</span>
          <span>أدنى: {(currentRate * 0.995).toFixed(0)}</span>
        </div>
      </div>
    </div>
  );
}