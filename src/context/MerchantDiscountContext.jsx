import { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const MerchantDiscountContext = createContext();

export function useMerchantDiscount() {
  return useContext(MerchantDiscountContext);
}

export function MerchantDiscountProvider({ children }) {
  const { userData } = useAuth();
  const [discountPercent, setDiscountPercent] = useState(0); // 0 = لا خصم
  const [loading, setLoading] = useState(true);

  // جلب نسبة الخصم من Firestore (وثيقة وحيدة)
  useEffect(() => {
    const docRef = doc(db, 'merchantSettings', 'default');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setDiscountPercent(docSnap.data().discountPercent || 0);
      } else {
        // إنشاء وثيقة افتراضية إذا لم توجد
        setDoc(docRef, { discountPercent: 10, updatedAt: new Date() });
        setDiscountPercent(10);
      }
      setLoading(false);
    }, (error) => {
      console.error('خطأ في تحميل إعدادات الخصم:', error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // دالة لحساب السعر النهائي (إذا كان المستخدم تاجراً)
  const getDiscountedPrice = (originalPriceUSD) => {
    if (!userData || userData.customerType !== 'merchant') return originalPriceUSD;
    const discount = discountPercent / 100;
    return originalPriceUSD * (1 - discount);
  };

  // دالة لتنسيق السعر المعروض (مع إظهار السعر الأصلي مشطوباً إذا كان تاجر)
  const formatPriceWithDiscount = (originalPriceUSD, currency = 'USD', rate = null) => {
    const isMerchant = userData?.customerType === 'merchant';
    const finalPrice = isMerchant ? getDiscountedPrice(originalPriceUSD) : originalPriceUSD;
    if (currency === 'USD') {
      return {
        final: `${finalPrice.toFixed(2)} $`,
        original: isMerchant ? `${originalPriceUSD.toFixed(2)} $` : null,
      };
    } else {
      // عرض بالليرة السورية باستخدام سعر الصرف
      const syp = rate ? (finalPrice * rate).toFixed(0) : null;
      return {
        final: syp ? `${parseInt(syp).toLocaleString()} ل.س` : `${finalPrice.toFixed(2)} $`,
        original: isMerchant && rate ? `${(originalPriceUSD * rate).toFixed(0).toLocaleString()} ل.س` : null,
      };
    }
  };

  return (
    <MerchantDiscountContext.Provider value={{ discountPercent, getDiscountedPrice, formatPriceWithDiscount, loading }}>
      {children}
    </MerchantDiscountContext.Provider>
  );
}