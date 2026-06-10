import { createContext, useContext, useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

const ExchangeRateContext = createContext();

export function useExchangeRate() {
  return useContext(ExchangeRateContext);
}

export function ExchangeRateProvider({ children }) {
  const [rate, setRate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoSync, setAutoSyncState] = useState(true);

  useEffect(() => {
    const docRef = doc(db, 'exchangeRate', 'default');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setRate(data.value);
        setAutoSyncState(data.autoSync !== undefined ? data.autoSync : true);
      } else {
        const defaultRate = 15000;
        setDoc(docRef, { value: defaultRate, autoSync: true, updatedAt: new Date() });
        setRate(defaultRate);
        setAutoSyncState(true);
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

  const setAutoSync = async (enabled) => {
    const docRef = doc(db, 'exchangeRate', 'default');
    try {
      await updateDoc(docRef, { autoSync: enabled, updatedAt: new Date() });
      setAutoSyncState(enabled);
      toast.success(enabled ? 'تم تفعيل المزامنة التلقائية' : 'تم إيقاف المزامنة التلقائية');
      return true;
    } catch (err) {
      toast.error('فشل تغيير حالة المزامنة: ' + err.message);
      return false;
    }
  };

  const manualUpdate = async () => {
    const user = auth.currentUser;
    if (!user) {
      toast.error('يجب تسجيل الدخول أولاً');
      return { success: false };
    }
    const idToken = await user.getIdToken();

    try {
      const response = await fetch('https://us-central1-marsgo-bec3a.cloudfunctions.net/manualUpdateExchangeRate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        toast.success(`تم تحديث السعر إلى ${data.rate.toLocaleString()} ل.س`);
        return { success: true, rate: data.rate };
      } else {
        throw new Error(data.error || 'فشل التحديث');
      }
    } catch (err) {
      console.error(err);
      toast.error('فشل تحديث السعر من المصدر الخارجي: ' + err.message);
      return { success: false };
    }
  };

  return (
    <ExchangeRateContext.Provider value={{
      rate,
      loading,
      updateRate,
      autoSync,
      setAutoSync,
      manualUpdate
    }}>
      {children}
    </ExchangeRateContext.Provider>
  );
}