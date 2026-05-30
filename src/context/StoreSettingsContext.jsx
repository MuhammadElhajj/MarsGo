import { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';

const StoreSettingsContext = createContext();

export function useStoreSettings() {
  return useContext(StoreSettingsContext);
}

export function StoreSettingsProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, 'storeSettings', 'default');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data());
      } else {
        const defaultData = {
          backgroundImageBase64: '', // صورة الخلفية بصيغة Base64
          updatedAt: new Date().toISOString(),
        };
        setDoc(docRef, defaultData);
        setSettings(defaultData);
      }
      setLoading(false);
    }, (error) => {
      console.error('خطأ في جلب إعدادات المتجر:', error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const updateSettings = async (newData) => {
    const docRef = doc(db, 'storeSettings', 'default');
    try {
      await updateDoc(docRef, { ...newData, updatedAt: new Date().toISOString() });
      toast.success('تم تحديث إعدادات المتجر بنجاح');
    } catch (err) {
      toast.error('فشل التحديث: ' + err.message);
      console.error(err);
    }
  };

  return (
    <StoreSettingsContext.Provider value={{ settings, loading, updateSettings }}>
      {children}
    </StoreSettingsContext.Provider>
  );
}