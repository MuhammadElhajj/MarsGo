import { useMemo } from 'react';
import './PackageCard.css';

export default function PackageCard({ pkg, onSelect, customBadge = null }) {
  const {
    name,
    currency,
    type,
    imageBase64,
    imageUrl,
    note,
    price,
    discount = 0,
  } = pkg || {};

  // حساب السعر النهائي
  const { priceValue, finalPrice, discountValue } = useMemo(() => {
    const rawPrice = typeof price === 'number' ? price : parseFloat(price);
    const disc = discount || 0;
    const final = disc ? (rawPrice * (1 - disc / 100)).toFixed(2) : rawPrice;
    return { priceValue: rawPrice, finalPrice: final, discountValue: disc };
  }, [price, discount]);

  const badgeText = useMemo(() => {
    if (customBadge) return customBadge;
    if (type === 'royalPass') return 'رويال باس';
    if (type === 'direct') return 'مباشر';
    return null;
  }, [customBadge, type]);

  const imgSrc = imageUrl || imageBase64;
  const imageSize = 70;

  return (
    <div 
      className="package-card" 
      onClick={() => onSelect(pkg)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(pkg); }}
      aria-label={name}
    >
      <div className="package-card__image" style={{ width: imageSize, height: imageSize, flexShrink: 0 }}>
        {imgSrc ? (
          <img 
            src={imgSrc} 
            alt={name} 
            loading="lazy"
            decoding="async"
            width={imageSize}
            height={imageSize}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div className="package-card__placeholder" aria-hidden="true">📦</div>
        )}
      </div>
      <div className="package-card__info">
        <h4 className="package-card__title">{name}</h4>
        {note && <p className="package-card__note">{note}</p>}
        {badgeText && <span className="package-card__badge">{badgeText}</span>}
        <div className="package-card__price">
          <span className="package-card__amount">
            {finalPrice} {currency === 'USD' ? '$' : 'ل.س'}
          </span>
          {discountValue > 0 && (
            <>
              <span className="package-card__old-price">
                {priceValue} {currency === 'USD' ? '$' : 'ل.س'}
              </span>
              <span className="package-card__discount">خصم {discountValue}%</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}