import { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

const ExchangeRateContext = createContext();

export function useExchangeRate() {
  return useContext(ExchangeRateContext);
}

export function ExchangeRateProvider({ children }) {
  const [rate, setRate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, 'exchangeRate', 'default');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setRate(docSnap.data().value);
      } else {
        // إنشاء وثيقة افتراضية بسعر افتراضي
        const defaultRate = 15000; // سعر افتراضي
        setDoc(docRef, { value: defaultRate, updatedAt: new Date() });
        setRate(defaultRate);
      }
      setLoading(false);
    }, (error) => {
      console.error('خطأ في جلب سعر الصرف:', error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const updateRate = async (newValue) => {
    const docRef = doc(db, 'exchangeRate', 'default');
    try {
      await updateDoc(docRef, { value: newValue, updatedAt: new Date() });
      toast.success('تم تحديث سعر الصرف بنجاح');
      return true;
    } catch (err) {
      toast.error('فشل تحديث السعر: ' + err.message);
      return false;
    }
  };

  return (
    <ExchangeRateContext.Provider value={{ rate, loading, updateRate }}>
      {children}
    </ExchangeRateContext.Provider>
  );
}