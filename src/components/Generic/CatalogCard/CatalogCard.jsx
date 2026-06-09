// src/components/Generic/CatalogCard/CatalogCard.jsx
import './CatalogCard.css';
import useFinalPrice from '../../../hooks/useFinalPrice';
import PriceDisplay from '../PriceDisplay/PriceDisplay';

export default function CatalogCard({ 
  item,           
  type = 'item',  
  onSelect,       
  showPrice = false,
  showBadge = false,
  customBadge = null,
  customLabels = {},  
}) {
  const {
    name = 'بدون اسم',
    imageBase64 = '',
    imageUrl = '',
    note = '',
    isAvailable = true,
    unavailableReason = '',
    price = null,
    discount = 0,
    currency = 'USD',
    id
  } = item || {};

  const productType = (type === 'game' || type === 'app') ? type : null;
  
  let originalPriceUSD = null;
  let finalPriceUSD = null;
  let finalDiscount = 0;
  
  if (price !== null && price !== undefined) {
    const priceNum = typeof price === 'number' ? price : parseFloat(price);
    originalPriceUSD = priceNum;
    const { finalPrice, discountPercent } = useFinalPrice(
      productType,
      id,
      priceNum,
      discount || 0
    );
    finalPriceUSD = finalPrice;
    finalDiscount = discountPercent;
  }

  const isUnavailable = isAvailable === false;
  
  const labels = {
    available: customLabels.available || 'متاح',
    unavailable: customLabels.unavailable || 'غير متاح',
    ...customLabels
  };

  const shouldShowPrice = showPrice || type === 'package';
  const shouldShowBadge = showBadge || customBadge !== null;

  const handleClick = () => {
    if (!isUnavailable && onSelect) {
      onSelect(item);
    }
  };

  const imgSrc = imageUrl || imageBase64;
  const imageSize = type === 'package' ? 70 : 80;

  return (
    <div 
      className={`catalog-card ${isUnavailable ? 'catalog-card--unavailable' : ''} catalog-card--${type}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
      aria-label={name}
    >
      <div className="catalog-card__image" style={{ width: imageSize, height: imageSize }}>
        {imgSrc ? (
          <img 
            src={imgSrc} 
            alt={name} 
            loading="lazy"
            width={imageSize}
            height={imageSize}
          />
        ) : (
          <div className="catalog-card__placeholder" aria-hidden="true">
            {type === 'game' && '🎮'}
            {type === 'app' && '📱'}
            {type === 'package' && '📦'}
            {!['game','app','package'].includes(type) && '🃏'}
          </div>
        )}
      </div>
      <div className="catalog-card__info">
        {/* الصف العلوي: الاسم + الحالة والشارة */}
        <div className="catalog-card__header-row">
          <h3 className="catalog-card__title">{name}</h3>
          <div className="catalog-card__status-group">
            <span className={`catalog-card__status status-${isAvailable ? 'available' : 'unavailable'}`}>
              {isAvailable ? labels.available : labels.unavailable}
            </span>
            {shouldShowBadge && customBadge && (
              <span className="catalog-card__badge">{customBadge}</span>
            )}
          </div>
        </div>
        
        {/* الملاحظة (إن وجدت) */}
        {note && <p className="catalog-card__note">{note}</p>}
        
        {/* سبب عدم التوفر (إن كان المنتج غير متاح) */}
        {isUnavailable && unavailableReason && (
          <p className="catalog-card__unavailable-reason">⚠️ {unavailableReason}</p>
        )}
        
        {/* السعر (إن أردت إظهاره) */}
        {shouldShowPrice && finalPriceUSD !== null && (
          <PriceDisplay
            originalPrice={originalPriceUSD}
            finalPrice={finalPriceUSD}
            currency={currency}
            discountPercent={finalDiscount}
          />
        )}
      </div>
    </div>
  );
}