// src/hooks/useFinalPrice.js
import { useDiscount } from '../context/DiscountContext';
import { useMerchantDiscount } from '../context/MerchantDiscountContext';

/**
 * حساب السعر النهائي بعد تطبيق أعلى خصم من:
 * - خصم العنصر (itemDiscount)
 * - خصم الفئة (من DiscountContext)
 * - خصم التاجر (من MerchantDiscountContext)
 *
 * @param {string|null} type - 'game', 'app', أو null
 * @param {string} productId - معرف المنتج (gameId أو appId)
 * @param {number} originalPrice - السعر الأصلي بالدولار
 * @param {number} itemDiscount - خصم العنصر نفسه (مثلاً من الباقة)
 * @returns {Object} { finalPrice, discountPercent }
 */
export default function useFinalPrice(type, productId, originalPrice, itemDiscount = 0) {
  const { getProductDiscount } = useDiscount();
  const { getMerchantDiscountPercent } = useMerchantDiscount();

  const categoryDiscount = type ? getProductDiscount(type, productId) : 0;
  const merchantDiscount = getMerchantDiscountPercent();

  // أعلى خصم من بين الثلاثة
  const discountPercent = Math.max(itemDiscount, categoryDiscount, merchantDiscount);
  const finalPrice = originalPrice * (1 - discountPercent / 100);

  return {
    finalPrice: parseFloat(finalPrice.toFixed(2)),
    discountPercent,
  };
}