// src/utils/productCategorizer.js

/**
 * تصنيف منتج خارجي إلى (categoryId, parentName) بناءً على إعدادات المابينغ والفاصل
 * @param {Object} externalProduct - { name, category_name, ... }
 * @param {Object} categoryMappings - { "Game": "games", "App": "apps", ... }
 * @param {Object} hierarchicalConfig - { "games": { separator: " - " }, "apps": { separator: " - " } }
 * @returns {{ categoryId: string, parentName: string | null }}
 */
export function categorizeProduct(externalProduct, categoryMappings, hierarchicalConfig) {
  const externalCat = externalProduct.category_name || '';
  let categoryId = categoryMappings[externalCat] || 'services';

  let parentName = null;
  if (hierarchicalConfig[categoryId] && externalProduct.name) {
    const separator = hierarchicalConfig[categoryId].separator || ' - ';
    if (externalProduct.name.includes(separator)) {
      const parts = externalProduct.name.split(separator);
      if (parts.length >= 2) {
        parentName = parts[0].trim();
      }
    }
  }

  // إذا كان القسم هرمياً ولكن لم نستخرج أب، ننقله للخدمات أو نتركه بدون أب (حسب رغبتك)
  if ((categoryId === 'games' || categoryId === 'apps') && !parentName) {
    categoryId = 'services';
  }

  return { categoryId, parentName };
}

/**
 * استخراج قائمة الأباء الفريدة من قائمة المنتجات (للعرض في صفحة القسم الهرمي)
 * @param {Array} products - مصفوفة المنتجات (يجب أن تحتوي على parentName و parentImageUrl)
 * @returns {Array} [{ name, count, imageUrl }]
 */
export function extractUniqueParents(products) {
  const map = new Map();
  products.forEach(p => {
    if (p.parentName) {
      if (!map.has(p.parentName)) {
        map.set(p.parentName, {
          name: p.parentName,
          count: 0,
          imageUrl: p.parentImageUrl || null,
        });
      }
      map.get(p.parentName).count++;
    }
  });
  return Array.from(map.values());
}