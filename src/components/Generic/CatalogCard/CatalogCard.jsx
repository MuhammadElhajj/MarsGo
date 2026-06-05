// src/components/Generic/CatalogCard/CatalogCard.jsx
import './CatalogCard.css';

export default function CatalogCard({ 
  item,           // العنصر (game, app, package)
  type = 'item',  // 'game', 'app', 'package', 'item'
  onSelect,       // دالة عند الضغط
  showPrice = false,
  showBadge = false,
  customBadge = null,
  customLabels = {},  // مثلاً { available: 'نشط', unavailable: 'غير نشط' }
}) {
  // استخراج البيانات مع قيم افتراضية آمنة
  const {
    name = 'بدون اسم',
    imageBase64 = '',
    note = '',
    isAvailable = true,
    unavailableReason = '',
    price = null,
    discount = 0,
    currency = 'USD'
  } = item || {};

  const isUnavailable = isAvailable === false;
  
  // حساب السعر النهائي إذا كان موجوداً
  let finalPrice = null;
  if (price !== null && price !== undefined) {
    const priceNum = typeof price === 'number' ? price : parseFloat(price);
    const discountNum = typeof discount === 'number' ? discount : parseFloat(discount) || 0;
    finalPrice = discountNum > 0 ? (priceNum * (1 - discountNum / 100)).toFixed(2) : priceNum.toFixed(2);
  }

  // نصوص الحالة قابلة للتخصيص
  const labels = {
    available: customLabels.available || 'متاحة',
    unavailable: customLabels.unavailable || 'غير متاحة',
    ...customLabels
  };

  // تحديد إظهار السعر تلقائياً للباقات إذا لم يُمرر showPrice صراحة
  const shouldShowPrice = showPrice || type === 'package';
  const shouldShowBadge = showBadge || customBadge !== null;

  const handleClick = () => {
    if (!isUnavailable && onSelect) {
      onSelect(item);
    }
  };

  return (
    <div 
      className={`catalog-card ${isUnavailable ? 'catalog-card--unavailable' : ''} catalog-card--${type}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
    >
      <div className="catalog-card__image">
        {imageBase64 ? (
          <img src={imageBase64} alt={name} loading="lazy" />
        ) : (
          <div className="catalog-card__placeholder">
            {type === 'game' && '🎮'}
            {type === 'app' && '📱'}
            {type === 'package' && '📦'}
            {!['game','app','package'].includes(type) && '🃏'}
          </div>
        )}
      </div>
      <div className="catalog-card__info">
        <h3 className="catalog-card__title">{name}</h3>
        {note && <p className="catalog-card__note">{note}</p>}
        {isUnavailable && unavailableReason && (
          <p className="catalog-card__unavailable-reason">⚠️ {unavailableReason}</p>
        )}
        <span className={`catalog-card__status status-${isAvailable ? 'available' : 'unavailable'}`}>
          {isAvailable ? labels.available : labels.unavailable}
        </span>
        {shouldShowPrice && finalPrice !== null && (
          <div className="catalog-card__price">
            <span className="catalog-card__amount">
              {finalPrice} {currency === 'USD' ? '$' : currency === 'SYP' ? 'ل.س' : currency}
            </span>
            {discount > 0 && (
              <span className="catalog-card__discount">-{discount}%</span>
            )}
          </div>
        )}
        {shouldShowBadge && customBadge && (
          <span className="catalog-card__badge">{customBadge}</span>
        )}
      </div>
    </div>
  );
}