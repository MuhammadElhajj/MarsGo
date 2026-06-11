import { useMemo } from 'react';
import { useAppStore } from '../../../store/store';

export default function PriceDisplay({ originalPrice, finalPrice, currency, discountPercent }) {
  const exchangeRate = useAppStore((state) => state.exchangeRate);
  const userCurrency = useAppStore((state) => state.currency);

  const { finalDisplay, originalDisplay } = useMemo(() => {
    let final = '';
    let original = null;

    if (userCurrency === 'USD') {
      final = `${finalPrice.toFixed(2)} $`;
      if (discountPercent > 0) original = `${originalPrice.toFixed(2)} $`;
    } else {
      const sypRate = exchangeRate || 15000;
      const finalSYP = finalPrice * sypRate;
      final = `${Math.ceil(finalSYP).toLocaleString()} ل.س`;
      if (discountPercent > 0) {
        const originalSYP = originalPrice * sypRate;
        original = `${Math.ceil(originalSYP).toLocaleString()} ل.س`;
      }
    }

    return { finalDisplay: final, originalDisplay: original };
  }, [userCurrency, finalPrice, discountPercent, originalPrice, exchangeRate]);

  const hasDiscount = discountPercent > 0 && originalDisplay;

  return (
    <div className="catalog-card__price">
      {hasDiscount && <span className="catalog-card__old-price">{originalDisplay}</span>}
      <span className="catalog-card__amount">{finalDisplay}</span>
      {discountPercent > 0 && <span className="catalog-card__discount">-{discountPercent}%</span>}
    </div>
  );
}