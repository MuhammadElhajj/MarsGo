import { useAppStore } from '../store/store';

export default function useFormattedPrice() {
  const exchangeRate = useAppStore((state) => state.exchangeRate);
  const currency = useAppStore((state) => state.currency);

  const formatPrice = (priceUSD) => {
    if (currency === 'USD') {
      return `${priceUSD} $`;
    } else {
      if (!exchangeRate) return `${priceUSD} $ (سعر الصرف غير متاح)`;
      const sypPrice = (priceUSD * exchangeRate).toFixed(0);
      return `${sypPrice.toLocaleString()} ل.س`;
    }
  };

  const getRawPrice = (priceUSD) => {
    if (currency === 'USD') return priceUSD;
    return priceUSD * (exchangeRate || 1);
  };

  return { formatPrice, getRawPrice, currency };
}