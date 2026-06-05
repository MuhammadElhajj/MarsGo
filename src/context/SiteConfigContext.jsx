// src/contexts/SiteConfigContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SiteConfigContext = createContext();

export function useSiteConfig() {
  return useContext(SiteConfigContext);
}

export function SiteConfigProvider({ children }) {
  const { user, userData } = useAuth();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // جلب الإعدادات من Firestore بشكل مباشر (real-time)
  useEffect(() => {
    const docRef = doc(db, 'siteConfig', 'default');
    const unsubscribe = onSnapshot(docRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          setConfig(docSnap.data());
        } else {
          // إنشاء إعدادات افتراضية إذا لم توجد
          const defaultConfig = {
            sections: {
              dashboard: {
                storeIntro: { visible: true, order: 1 },
                spendingProgress: { visible: true, order: 2 },
                servicesGrid: { visible: true, order: 3 },
                adSpace: { visible: true, order: 4 },
                howItWorks: { visible: true, order: 5 },
                userStatsGrid: { visible: true, order: 6 },
                ordersList: { visible: true, order: 7 }
              }
            },
            servicesOrder: ['gaming', 'apps', 'crypto', 'exchange'],
            homepageGames: [],
            globalColors: {
              primary: '#4f46e5',
              secondary: '#10b981'
            },
            updatedAt: new Date().toISOString()
          };
          // إنشاء الوثيقة (تتم مرة واحدة)
          import('firebase/firestore').then(({ setDoc }) => {
            setDoc(docRef, defaultConfig);
          });
          setConfig(defaultConfig);
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('خطأ في تحميل إعدادات الموقع:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // دالة لتحديث الإعدادات (للمدير فقط)
  const updateConfig = async (newData) => {
    if (!userData || userData.role !== 'admin') {
      toast.error('غير مصرح لك بتعديل الإعدادات');
      return false;
    }
    const docRef = doc(db, 'siteConfig', 'default');
    try {
      await updateDoc(docRef, {
        ...newData,
        updatedAt: new Date().toISOString()
      });
      toast.success('تم تحديث إعدادات الموقع');
      return true;
    } catch (err) {
      toast.error('فشل التحديث: ' + err.message);
      return false;
    }
  };

  return (
    <SiteConfigContext.Provider value={{ config, loading, error, updateConfig }}>
      {children}
    </SiteConfigContext.Provider>
  );
}