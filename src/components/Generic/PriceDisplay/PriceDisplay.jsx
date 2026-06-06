// src/components/Generic/CatalogCard/PriceDisplay.jsx
import { useExchangeRate } from '../../../context/ExchangeRateContext';
import { useCurrency } from '../../../context/CurrencyContext';

export default function PriceDisplay({ originalPrice, finalPrice, currency, discountPercent }) {
  const { rate } = useExchangeRate();
  const { currency: userCurrency } = useCurrency();

  let finalDisplay = '';
  let originalDisplay = null;

  if (userCurrency === 'USD') {
    finalDisplay = `${finalPrice.toFixed(2)} $`;
    if (discountPercent > 0) originalDisplay = `${originalPrice.toFixed(2)} $`;
  } else {
    const sypRate = rate || 15000;
    const finalSYP = finalPrice * sypRate;
    finalDisplay = `${Math.ceil(finalSYP).toLocaleString()} ل.س`;
    if (discountPercent > 0) {
      const originalSYP = originalPrice * sypRate;
      originalDisplay = `${Math.ceil(originalSYP).toLocaleString()} ل.س`;
    }
  }

  return (
    <div className="catalog-card__price">
      {originalDisplay && <span className="catalog-card__old-price">{originalDisplay}</span>}
      <span className="catalog-card__amount">{finalDisplay}</span>
      {discountPercent > 0 && <span className="catalog-card__discount">-{discountPercent}%</span>}
    </div>
  );
}