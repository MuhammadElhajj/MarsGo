import { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { uploadImage, deleteImage } from '../utils/uploadImage';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

const ServicesContext = createContext();

export function useServices() {
  return useContext(ServicesContext);
}

export function ServicesProvider({ children }) {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchServices = async () => {
    if (!user) {
      setServices([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const q = query(collection(db, 'services'), orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      const servicesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setServices(servicesList);
    } catch (error) {
      console.error('خطأ في جلب الخدمات:', error);
    } finally {
      setLoading(false);
    }
  };

  // دالة مساعدة لرفع صورة الخلفية للخدمة
  const uploadServiceBgImage = async (serviceId, base64Image) => {
    if (!base64Image) return null;
    const path = `services/${serviceId}/bg_${Date.now()}.jpg`;
    const url = await uploadImage(base64Image, path);
    return url;
  };

  // إضافة خدمة جديدة (مع رفع الصورة)
  const addService = async (serviceData) => {
    const { bgImageBase64, bgImageUrl, ...restData } = serviceData;
    const tempImageBase64 = bgImageBase64 || (bgImageUrl ? null : null);

    try {
      // إنشاء المستند أولاً بدون الصورة
      const docRef = await addDoc(collection(db, 'services'), {
        ...restData,
        bgImageUrl: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      const serviceId = docRef.id;

      let finalImageUrl = null;
      if (tempImageBase64) {
        finalImageUrl = await uploadServiceBgImage(serviceId, tempImageBase64);
      } else if (bgImageUrl) {
        finalImageUrl = bgImageUrl;
      }

      if (finalImageUrl) {
        await updateDoc(doc(db, 'services', serviceId), { bgImageUrl: finalImageUrl });
      }

      toast.success('تمت إضافة الخدمة بنجاح');
      await fetchServices();
      return serviceId;
    } catch (err) {
      toast.error('فشل إضافة الخدمة: ' + err.message);
      throw err;
    }
  };

  // تحديث خدمة (مع معالجة الصورة)
  const updateService = async (id, updatedData) => {
    const oldService = services.find(s => s.id === id);
    const { bgImageBase64, bgImageUrl, ...restData } = updatedData;
    let newImageUrl = bgImageUrl;

    try {
      if (bgImageBase64) {
        // حذف الصورة القديمة إن وجدت
        if (oldService?.bgImageUrl) {
          await deleteImage(oldService.bgImageUrl);
        }
        newImageUrl = await uploadServiceBgImage(id, bgImageBase64);
      } else if (bgImageUrl && bgImageUrl !== oldService?.bgImageUrl) {
        if (oldService?.bgImageUrl) {
          await deleteImage(oldService.bgImageUrl);
        }
        newImageUrl = bgImageUrl;
      }

      await updateDoc(doc(db, 'services', id), {
        ...restData,
        ...(newImageUrl && { bgImageUrl: newImageUrl }),
        updatedAt: new Date().toISOString(),
      });
      toast.success('تم تحديث الخدمة');
      await fetchServices();
    } catch (err) {
      toast.error('فشل تحديث الخدمة: ' + err.message);
      throw err;
    }
  };

  // حذف خدمة (مع حذف صورتها)
  const deleteService = async (id) => {
    try {
      const service = services.find(s => s.id === id);
      if (service?.bgImageUrl) {
        await deleteImage(service.bgImageUrl);
      }
      await deleteDoc(doc(db, 'services', id));
      toast.success('تم حذف الخدمة');
      await fetchServices();
    } catch (err) {
      toast.error('فشل حذف الخدمة: ' + err.message);
      throw err;
    }
  };

  useEffect(() => {
    fetchServices();
  }, [user]);

  return (
    <ServicesContext.Provider value={{ services, loading, addService, updateService, deleteService }}>
      {children}
    </ServicesContext.Provider>
  );
}