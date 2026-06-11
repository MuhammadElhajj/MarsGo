import { useAppStore } from '../store/store';

/**
 * حساب السعر النهائي بعد تطبيق أعلى خصم من:
 * - خصم العنصر (itemDiscount)
 * - خصم الفئة (من DiscountContext/الـ store)
 * - خصم التاجر (من MerchantDiscountContext/الـ store)
 *
 * @param {string|null} type - 'game', 'app', أو null
 * @param {string} productId - معرف المنتج (gameId أو appId)
 * @param {number} originalPrice - السعر الأصلي بالدولار
 * @param {number} itemDiscount - خصم العنصر نفسه (مثلاً من الباقة)
 * @returns {Object} { finalPrice, discountPercent }
 */
export default function useFinalPrice(type, productId, originalPrice, itemDiscount = 0) {
  const discounts = useAppStore((state) => state.discounts);
  const merchantDiscountPercent = useAppStore((state) => state.merchantDiscountPercent);
  const userData = useAppStore((state) => state.userData);

  // حساب خصم الفئة (categoryDiscount)
  let categoryDiscount = 0;
  if (type === 'game') {
    categoryDiscount = discounts.games || 0;
    const specificKey = `game_${productId}`;
    if (discounts.specific && discounts.specific[specificKey]) {
      categoryDiscount = Math.max(categoryDiscount, discounts.specific[specificKey]);
    }
  } else if (type === 'app') {
    categoryDiscount = discounts.apps || 0;
    const specificKey = `app_${productId}`;
    if (discounts.specific && discounts.specific[specificKey]) {
      categoryDiscount = Math.max(categoryDiscount, discounts.specific[specificKey]);
    }
  }

  // خصم التاجر (فقط إذا كان نوع العميل 'merchant')
  const merchantDiscount = (userData?.customerType === 'merchant') ? merchantDiscountPercent : 0;

  // أعلى خصم
  const discountPercent = Math.max(itemDiscount, categoryDiscount, merchantDiscount);
  const finalPrice = originalPrice * (1 - discountPercent / 100);

  return {
    finalPrice: parseFloat(finalPrice.toFixed(2)),
    discountPercent,
  };
}