// src/utils/numberFormatter.js

/**
 * تقريب الرقم لأعلى إلى منزلتين عشريتين (Ceil with 2 decimals)
 * @param {number|string} value - القيمة المدخلة
 * @returns {string} - النص المنسق (مثل "10.50")
 */
export function formatCeilTwoDecimals(value) {
  if (value === undefined || value === null) return '0.00';
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(num)) return '0.00';
  // التقريب لأعلى إلى أقرب 0.01
  const roundedUp = Math.ceil(num * 100) / 100;
  return roundedUp.toFixed(2);
}

/**
 * نفس الدالة ولكن مع إضافة رمز العملة (اختياري)
 * @param {number|string} value - القيمة
 * @param {string} currency - رمز العملة (مثل "$" أو "ل.س")
 * @returns {string}
 */
export function formatPriceCeil(value, currency = '') {
  const formatted = formatCeilTwoDecimals(value);
  return currency ? `${formatted} ${currency}` : formatted;
}