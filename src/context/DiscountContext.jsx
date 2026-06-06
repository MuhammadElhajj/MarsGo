// src/context/DiscountContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

const DiscountContext = createContext();

export function useDiscount() {
  return useContext(DiscountContext);
}

export function DiscountProvider({ children }) {
  const [discounts, setDiscounts] = useState({
    games: 0,           // خصم عام على جميع الألعاب (%)
    apps: 0,            // خصم عام على جميع التطبيقات (%)
    specific: {}        // خصم خاص لكل منتج { gameId: 10, appId: 15 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, 'discountSettings', 'default');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setDiscounts(docSnap.data());
      } else {
        // إنشاء وثيقة افتراضية
        const defaultData = { games: 0, apps: 0, specific: {} };
        setDoc(docRef, defaultData);
        setDiscounts(defaultData);
      }
      setLoading(false);
    }, (error) => {
      console.error('خطأ في تحميل إعدادات الخصم:', error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // دالة لحساب الخصم النهائي لمنتج معين
  const getProductDiscount = (type, productId) => {
    let discount = 0;
    if (type === 'game') {
      discount = discounts.games;
      if (discounts.specific[`game_${productId}`]) {
        discount = Math.max(discount, discounts.specific[`game_${productId}`]);
      }
    } else if (type === 'app') {
      discount = discounts.apps;
      if (discounts.specific[`app_${productId}`]) {
        discount = Math.max(discount, discounts.specific[`app_${productId}`]);
      }
    }
    return discount;
  };

  const updateDiscounts = async (newDiscounts) => {
    const docRef = doc(db, 'discountSettings', 'default');
    await setDoc(docRef, newDiscounts, { merge: true });
  };

  return (
    <DiscountContext.Provider value={{ discounts, loading, getProductDiscount, updateDiscounts }}>
      {children}
    </DiscountContext.Provider>
  );
}