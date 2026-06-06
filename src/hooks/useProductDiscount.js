// src/hooks/useProductDiscount.js
import { useDiscount } from '../context/DiscountContext';

/**
 * هوك لحساب الخصم النهائي لمنتج معين (لعبة أو تطبيق)
 * @param {string} type - 'game' أو 'app' (أو null)
 * @param {string} productId - معرف المنتج (مثل gameId أو appId)
 * @returns {Object} { discountPercent }
 */
export default function useProductDiscount(type, productId) {
  const { getProductDiscount } = useDiscount();
  
  // إذا لم يكن هناك نوع أو معرف صالح، لا خصم
  if (!type || !productId) {
    return { discountPercent: 0 };
  }
  
  const discountPercent = getProductDiscount(type, productId);
  return { discountPercent };
}