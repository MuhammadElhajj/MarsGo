// src/services/recentlyViewedService.js

const STORAGE_PREFIX = 'recentlyViewed_';

/**
 * الحصول على مفتاح التخزين الخاص بالمستخدم
 * @param {string} email - البريد الإلكتروني للمستخدم
 * @returns {string} مفتاح localStorage
 */
const getStorageKey = (email) => {
  if (!email) return `${STORAGE_PREFIX}guest`;
  // تنظيف البريد من الأحرف غير المسموحة في localStorage
  const cleanEmail = email.replace(/[^a-zA-Z0-9@._-]/g, '');
  return `${STORAGE_PREFIX}${cleanEmail}`;
};

/**
 * جلب قائمة "آخر ما شاهدت" من localStorage
 * @param {string} email - البريد الإلكتروني للمستخدم
 * @returns {Array} مصفوفة العناصر
 */
export const getRecentlyViewed = (email) => {
  try {
    const key = getStorageKey(email);
    const data = localStorage.getItem(key);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error reading recently viewed:', error);
    return [];
  }
};

/**
 * إضافة عنصر إلى قائمة "آخر ما شاهدت"
 * @param {string} email - البريد الإلكتروني للمستخدم
 * @param {Object} item - العنصر المراد إضافته { id, name, imageUrl, type, link }
 * @param {number} maxItems - الحد الأقصى للعناصر (افتراضي 6)
 */
export const addRecentlyViewed = (email, item, maxItems = 6) => {
  if (!email || !item || !item.id) return;

  try {
    const key = getStorageKey(email);
    let items = getRecentlyViewed(email);

    // إزالة أي عنصر مكرر (نفس id ونفس type)
    items = items.filter(i => !(i.id === item.id && i.type === item.type));

    // إضافة العنصر الجديد في البداية
    items.unshift({
      id: item.id,
      name: item.name || 'عنوان',
      imageUrl: item.imageUrl || '',
      type: item.type || 'game', // 'game' أو 'app'
      link: item.link || '',
      viewedAt: Date.now(),
    });

    // قص القائمة إلى الحد الأقصى
    items = items.slice(0, maxItems);

    // حفظ في localStorage
    localStorage.setItem(key, JSON.stringify(items));
  } catch (error) {
    console.error('Error adding recently viewed:', error);
  }
};

/**
 * مسح قائمة "آخر ما شاهدت" لمستخدم معين
 * @param {string} email - البريد الإلكتروني للمستخدم
 */
export const clearRecentlyViewed = (email) => {
  try {
    const key = getStorageKey(email);
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error clearing recently viewed:', error);
  }
};