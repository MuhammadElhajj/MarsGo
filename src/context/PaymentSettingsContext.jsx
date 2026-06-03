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
  const [error, setError] = useState(null);

  useEffect(() => {
    const docRef = doc(db, 'paymentSettings', 'default');
    const unsubscribe = onSnapshot(docRef, 
      async (docSnap) => {
        setError(null);
        if (docSnap.exists()) {
          setSettings(docSnap.data());
        } else {
          // إنشاء وثيقة افتراضية إذا لم تكن موجودة
          const defaultData = {
            qrImageBase64: '',
            accountNumber: '',
            accountName: '',
            bankName: '',
            link: '',
            updatedAt: new Date().toISOString(),
          };
          try {
            await setDoc(docRef, defaultData);
            console.log('✅ تم إنشاء إعدادات الدفع الافتراضية');
            setSettings(defaultData);
          } catch (err) {
            console.error('❌ فشل إنشاء إعدادات الدفع:', err);
            setError(err.message);
            // يمكن وضع بيانات وهمية للعرض المؤقت
            setSettings(defaultData);
          }
        }
        setLoading(false);
      },
      (err) => {
        console.error('❌ خطأ في الاستماع لإعدادات الدفع:', err);
        setError(err.message);
        setLoading(false);
      }
    );
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
      throw err;
    }
  };

  return (
    <PaymentSettingsContext.Provider value={{ settings, loading, error, updateSettings }}>
      {children}
    </PaymentSettingsContext.Provider>
  );
}