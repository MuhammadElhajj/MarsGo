// src/components/Generic/CatalogCard/CatalogCard.jsx
import './CatalogCard.css';
import useProductDiscount from '../../../hooks/useProductDiscount';
import PriceDisplay from '../PriceDisplay/PriceDisplay'; // ✅ استيراد مكون عرض السعر

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
    currency = 'USD',
    id
  } = item || {};

  // تحديد نوع المنتج للخصم العام (فقط للألعاب والتطبيقات)
  const productType = (type === 'game' || type === 'app') ? type : null;
  // جلب الخصم العام (إن وجد) باستخدام الهوك
  const { discountPercent: categoryDiscount = 0 } = useProductDiscount(productType, id) || {};
  
  // الخصم النهائي = أقصى قيمة بين خصم العنصر والخصم العام
  const finalDiscount = Math.max(discount, categoryDiscount);
  
  const isUnavailable = isAvailable === false;
  
  // حساب السعر الأصلي والنهائي (بالدولار)
  let originalPriceUSD = null;
  let finalPriceUSD = null;
  if (price !== null && price !== undefined) {
    const priceNum = typeof price === 'number' ? price : parseFloat(price);
    originalPriceUSD = priceNum;
    finalPriceUSD = finalDiscount > 0 
      ? priceNum * (1 - finalDiscount / 100)
      : priceNum;
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
        {shouldShowPrice && finalPriceUSD !== null && (
          <PriceDisplay
            originalPrice={originalPriceUSD}
            finalPrice={finalPriceUSD}
            currency={currency}
            discountPercent={finalDiscount}
          />
        )}
        {shouldShowBadge && customBadge && (
          <span className="catalog-card__badge">{customBadge}</span>
        )}
      </div>
    </div>
  );
}