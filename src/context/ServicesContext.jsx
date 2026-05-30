import { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import toast from 'react-hot-toast';

const ServicesContext = createContext();

export function useServices() {
  return useContext(ServicesContext);
}

export function ServicesProvider({ children }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'services'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const servicesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setServices(servicesList);
      setLoading(false);
    }, (error) => {
      console.error('خطأ في جلب الخدمات:', error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // إضافة خدمة جديدة
  const addService = async (serviceData) => {
    try {
      const docRef = await addDoc(collection(db, 'services'), {
        ...serviceData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      toast.success('تمت إضافة الخدمة بنجاح');
      return docRef.id;
    } catch (err) {
      toast.error('فشل إضافة الخدمة: ' + err.message);
      throw err;
    }
  };

  // تحديث خدمة
  const updateService = async (id, updatedData) => {
    try {
      await updateDoc(doc(db, 'services', id), {
        ...updatedData,
        updatedAt: new Date().toISOString(),
      });
      toast.success('تم تحديث الخدمة');
    } catch (err) {
      toast.error('فشل تحديث الخدمة: ' + err.message);
      throw err;
    }
  };

  // حذف خدمة
  const deleteService = async (id) => {
    try {
      await deleteDoc(doc(db, 'services', id));
      toast.success('تم حذف الخدمة');
    } catch (err) {
      toast.error('فشل حذف الخدمة: ' + err.message);
      throw err;
    }
  };

  return (
    <ServicesContext.Provider value={{ services, loading, addService, updateService, deleteService }}>
      {children}
    </ServicesContext.Provider>
  );
}