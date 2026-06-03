import { useExchangeRate } from '../context/ExchangeRateContext';
import { useCurrency } from '../context/CurrencyContext';

export default function useFormattedPrice() {
  const { rate } = useExchangeRate();
  const { currency } = useCurrency();

  const formatPrice = (priceUSD) => {
    if (currency === 'USD') {
      return `${priceUSD} $`;
    } else {
      if (!rate) return `${priceUSD} $ (سعر الصرف غير متاح)`;
      const sypPrice = (priceUSD * rate).toFixed(0);
      return `${sypPrice.toLocaleString()} ل.س`;
    }
  };

  const getRawPrice = (priceUSD) => {
    if (currency === 'USD') return priceUSD;
    return priceUSD * (rate || 1);
  };

  return { formatPrice, getRawPrice, currency };
}