// src/contexts/TopUpSettingsContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const TopUpSettingsContext = createContext();

export function useTopUpSettings() {
  return useContext(TopUpSettingsContext);
}

export function TopUpSettingsProvider({ children }) {
  const { userData } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, 'topUpSettings', 'default');
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setSettings(docSnap.data());
        } else {
          // ✅ لا نقوم بإنشاء بيانات افتراضية، نتركها null
          console.log('⚠️ لا توجد إعدادات إيداع. يرجى إعدادها من لوحة الإدارة.');
          setSettings(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error('❌ خطأ في تحميل إعدادات الإيداع:', error);
        setSettings(null);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const updateSettings = async (newSettings) => {
    if (!userData || userData.role !== 'admin') {
      toast.error('غير مصرح لك بتعديل الإعدادات');
      return false;
    }
    const docRef = doc(db, 'topUpSettings', 'default');
    try {
      // استخدام setDoc مع merge لإنشاء المستند إذا لم يكن موجوداً
      await setDoc(docRef, {
        ...newSettings,
        updatedAt: new Date().toISOString(),
        updatedBy: userData.uid,
      }, { merge: true });
      toast.success('✅ تم تحديث إعدادات الإيداع');
      return true;
    } catch (err) {
      toast.error('❌ فشل التحديث: ' + err.message);
      console.error(err);
      return false;
    }
  };

  return (
    <TopUpSettingsContext.Provider value={{ settings, loading, updateSettings }}>
      {children}
    </TopUpSettingsContext.Provider>
  );
}