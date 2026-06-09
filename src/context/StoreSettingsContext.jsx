import { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { uploadImage, deleteImage } from '../utils/uploadImage';
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
        // البيانات الافتراضية (بدون صور)
        const defaultData = {
          backgroundImageUrl: '',
          loginPhoneImageUrl: '',
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

  // دالة لرفع صورة الخلفية وحذف القديمة
  const uploadBackgroundImage = async (base64Image, oldImageUrl) => {
    if (!base64Image) return null;
    if (oldImageUrl) await deleteImage(oldImageUrl);
    const path = `store/background_${Date.now()}.jpg`;
    return await uploadImage(base64Image, path);
  };

  // دالة لرفع صورة الهاتف وحذف القديمة
  const uploadPhoneImage = async (base64Image, oldImageUrl) => {
    if (!base64Image) return null;
    if (oldImageUrl) await deleteImage(oldImageUrl);
    const path = `store/phone_${Date.now()}.jpg`;
    return await uploadImage(base64Image, path);
  };

  const updateSettings = async (newData) => {
    const docRef = doc(db, 'storeSettings', 'default');
    const current = settings || {};

    // معالجة صورة الخلفية
    let backgroundImageUrl = newData.backgroundImageUrl || current.backgroundImageUrl;
    if (newData.backgroundImageBase64) {
      backgroundImageUrl = await uploadBackgroundImage(newData.backgroundImageBase64, current.backgroundImageUrl);
    } else if (newData.backgroundImageUrl === '') {
      // حذف الصورة القديمة إذا تم إرسال سلسلة فارغة
      if (current.backgroundImageUrl) await deleteImage(current.backgroundImageUrl);
      backgroundImageUrl = '';
    }

    // معالجة صورة الهاتف
    let loginPhoneImageUrl = newData.loginPhoneImageUrl || current.loginPhoneImageUrl;
    if (newData.loginPhoneImageBase64) {
      loginPhoneImageUrl = await uploadPhoneImage(newData.loginPhoneImageBase64, current.loginPhoneImageUrl);
    } else if (newData.loginPhoneImageUrl === '') {
      if (current.loginPhoneImageUrl) await deleteImage(current.loginPhoneImageUrl);
      loginPhoneImageUrl = '';
    }

    // إزالة الحقول المؤقتة base64 قبل التخزين
    const { backgroundImageBase64, loginPhoneImageBase64, ...rest } = newData;

    try {
      await updateDoc(docRef, {
        ...rest,
        backgroundImageUrl,
        loginPhoneImageUrl,
        updatedAt: new Date().toISOString(),
      });
      toast.success('تم تحديث إعدادات المتجر بنجاح');
    } catch (err) {
      toast.error('فشل التحديث: ' + err.message);
      console.error(err);
      throw err;
    }
  };

  return (
    <StoreSettingsContext.Provider value={{ settings, loading, updateSettings }}>
      {children}
    </StoreSettingsContext.Provider>
  );
}