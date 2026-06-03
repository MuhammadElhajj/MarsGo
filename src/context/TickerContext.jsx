// context/TickerContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

const TickerContext = createContext();

export function useTicker() {
  return useContext(TickerContext);
}

export function TickerProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, 'tickerSettings', 'default');
    const unsubscribe = onSnapshot(docRef, 
      async (docSnap) => {
        if (docSnap.exists()) {
          setSettings(docSnap.data());
        } else {
          // إنشاء بيانات افتراضية مع isActive: true
          const defaultData = {
            text: 'مرحباً بك في MarsGo | عروض حصرية | شحن ألعاب بأسعار مخفضة',
            segments: [
              { text: 'مرحباً بك في MarsGo', color: '#ffffff', fontWeight: 'bold', fontFamily: 'inherit' },
              { text: ' | ', color: '#ffffff', fontWeight: 'normal', fontFamily: 'inherit' },
              { text: 'عروض حصرية', color: '#f97316', fontWeight: 'bold', fontFamily: 'inherit' },
              { text: ' | ', color: '#ffffff', fontWeight: 'normal', fontFamily: 'inherit' },
              { text: 'شحن ألعاب بأسعار مخفضة', color: '#10b981', fontWeight: 'bold', fontFamily: 'inherit' }
            ],
            speed: 30,
            direction: 'right-to-left',
            isActive: true,
            updatedAt: new Date().toISOString()
          };
          try {
            await setDoc(docRef, defaultData);
            console.log('✅ تم إنشاء إعدادات الشريط الافتراضية');
            setSettings(defaultData);
          } catch (err) {
            console.error('❌ فشل إنشاء الإعدادات:', err);
          }
        }
        setLoading(false);
      },
      (error) => {
        console.error('خطأ في الاستماع:', error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const updateSettings = async (newData) => {
    const docRef = doc(db, 'tickerSettings', 'default');
    try {
      await updateDoc(docRef, { ...newData, updatedAt: new Date().toISOString() });
      toast.success('تم تحديث شريط الأخبار');
      return true;
    } catch (err) {
      toast.error('فشل التحديث: ' + err.message);
      return false;
    }
  };

  return (
    <TickerContext.Provider value={{ settings, loading, updateSettings }}>
      {children}
    </TickerContext.Provider>
  );
}