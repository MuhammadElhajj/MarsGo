// src/components/UserComponents/Gaming/PackageCard/PackageCard.jsx
import './PackageCard.css';

export default function PackageCard({ pkg, onSelect }) {
  const { name, price, currency, discount, type } = pkg;
  const finalPrice = discount ? (price * (1 - discount / 100)).toFixed(2) : price;

  return (
    <div className="package-card" onClick={() => onSelect(pkg)}>
      <div className="package-card__info">
        <h4 className="package-card__title">{name}</h4>
        {type === 'royalPass' && <span className="package-card__badge">رويال باس</span>}
        {type === 'direct' && <span className="package-card__badge">مباشر</span>}
      </div>
      <div className="package-card__price">
        <span className="package-card__amount">
          {finalPrice} {currency === 'USD' ? '$' : 'ل.س'}
        </span>
        {discount > 0 && (
          <>
            <span className="package-card__old-price">
              {price} {currency === 'USD' ? '$' : 'ل.س'}
            </span>
            <span className="package-card__discount">خصم {discount}%</span>
          </>
        )}
      </div>
    </div>
  );
}