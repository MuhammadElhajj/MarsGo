import { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';

const PaymentSettingsContext = createContext();

export function usePaymentSettings() {
  return useContext(PaymentSettingsContext);
}

export function PaymentSettingsProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, 'paymentSettings', 'default');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data());
      } else {
        const defaultData = {
          qrImageBase64: '',
          accountNumber: '',
          accountName: '',
          bankName: '',
          link: '',
          updatedAt: new Date().toISOString(),
        };
        setDoc(docRef, defaultData);
        setSettings(defaultData);
      }
      setLoading(false);
    }, (error) => {
      console.error('خطأ في جلب إعدادات الدفع:', error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const updateSettings = async (newData) => {
    const docRef = doc(db, 'paymentSettings', 'default');
    try {
      await updateDoc(docRef, { ...newData, updatedAt: new Date().toISOString() });
      toast.success('تم تحديث معلومات الدفع بنجاح');
    } catch (err) {
      toast.error('فشل التحديث: ' + err.message);
      console.error(err);
    }
  };

  // ✅ هذا السطر كان مفقوداً
  return (
    <PaymentSettingsContext.Provider value={{ settings, loading, updateSettings }}>
      {children}
    </PaymentSettingsContext.Provider>
  );
}