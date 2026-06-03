// src/components/UserComponents/Gaming/PackageCard/PackageCard.jsx
import './PackageCard.css';

export default function PackageCard({ pkg, onSelect, customBadge = null }) {
  // ✅ التأكد من أن price رقمي لتجنب الأخطاء
  const priceValue = typeof pkg.price === 'number' ? pkg.price : parseFloat(pkg.price);
  const discountValue = pkg.discount || 0;
  const finalPrice = discountValue ? (priceValue * (1 - discountValue / 100)).toFixed(2) : priceValue;

  const { name, currency, type, imageBase64, note } = pkg;

  // ✅ تحديد النص المعروض للشارة (badge)
  let badgeText = null;
  if (customBadge) {
    badgeText = customBadge;
  } else if (type === 'royalPass') {
    badgeText = 'رويال باس';
  } else if (type === 'direct') {
    badgeText = 'مباشر';
  }

  return (
    <div className="package-card" onClick={() => onSelect(pkg)}>
      <div className="package-card__image">
        {imageBase64 ? (
          <img src={imageBase64} alt={name} />
        ) : (
          <div className="package-card__placeholder">📦</div>
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