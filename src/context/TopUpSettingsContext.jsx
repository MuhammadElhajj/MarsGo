import { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const TopUpSettingsContext = createContext();

export function useTopUpSettings() {
  return useContext(TopUpSettingsContext);
}

export function TopUpSettingsProvider({ children }) {
  const { userData } = useAuth();
  const [settings, setSettings] = useState({
    usdt: { enabled: true, address: '', qrCode: '', network: 'TRC20' },
    shamCash: { enabled: true, accountName: '', accountNumber: '', qrCode: '' },
    siretelCash: { enabled: true, accountName: '', accountNumber: '', qrCode: '' },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, 'topUpSettings', 'default');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data());
      } else {
        // بيانات افتراضية
        const defaultData = {
          usdt: { enabled: true, address: '', qrCode: '', network: 'TRC20' },
          shamCash: { enabled: true, accountName: 'MarsGo', accountNumber: '', qrCode: '' },
          siretelCash: { enabled: true, accountName: 'MarsGo', accountNumber: '', qrCode: '' },
        };
        setSettings(defaultData);
        // إنشاء الوثيقة (سيتم إنشاؤها تلقائياً عند أول حفظ)
      }
      setLoading(false);
    }, (error) => {
      console.error('خطأ في تحميل إعدادات الإيداع:', error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const updateSettings = async (newSettings) => {
    if (!userData || userData.role !== 'admin') {
      toast.error('غير مصرح لك بتعديل الإعدادات');
      return false;
    }
    const docRef = doc(db, 'topUpSettings', 'default');
    try {
      await updateDoc(docRef, newSettings);
      toast.success('تم تحديث إعدادات الإيداع');
      return true;
    } catch (err) {
      toast.error('فشل التحديث: ' + err.message);
      return false;
    }
  };

  return (
    <TopUpSettingsContext.Provider value={{ settings, loading, updateSettings }}>
      {children}
    </TopUpSettingsContext.Provider>
  );
}