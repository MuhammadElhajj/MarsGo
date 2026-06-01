import { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
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

  useEffect(() => {
    fetchServices();
  }, [user]);

  const addService = async (serviceData) => {
    try {
      const docRef = await addDoc(collection(db, 'services'), {
        ...serviceData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      toast.success('تمت إضافة الخدمة بنجاح');
      await fetchServices();
      return docRef.id;
    } catch (err) {
      toast.error('فشل إضافة الخدمة: ' + err.message);
      throw err;
    }
  };

  const updateService = async (id, updatedData) => {
    try {
      await updateDoc(doc(db, 'services', id), {
        ...updatedData,
        updatedAt: new Date().toISOString(),
      });
      toast.success('تم تحديث الخدمة');
      await fetchServices();
    } catch (err) {
      toast.error('فشل تحديث الخدمة: ' + err.message);
      throw err;
    }
  };

  const deleteService = async (id) => {
    try {
      await deleteDoc(doc(db, 'services', id));
      toast.success('تم حذف الخدمة');
      await fetchServices();
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

// import { createContext, useContext, useEffect, useState } from 'react';
// import { db } from '../firebase';
// import { collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
// import toast from 'react-hot-toast';
// import { useAuth } from './AuthContext'; // ✅ استيراد useAuth

// const ServicesContext = createContext();

// export function useServices() {
//   return useContext(ServicesContext);
// }

// export function ServicesProvider({ children }) {
//   const { user } = useAuth(); // ✅ مراقبة المستخدم
//   const [services, setServices] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     // ✅ إعادة تعيين حالة التحميل عند تغير المستخدم
//     setLoading(true);
    
//     const q = query(collection(db, 'services'), orderBy('order', 'asc'));
//     const unsubscribe = onSnapshot(q, (snapshot) => {
//       const servicesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//       setServices(servicesList);
//       setLoading(false);
//     }, (error) => {
//       console.error('خطأ في جلب الخدمات:', error);
//       setLoading(false);
//     });
    
//     return () => unsubscribe();
//   }, [user]); // ✅ إعادة الاشتراك عند تسجيل الدخول أو الخروج

//   // إضافة خدمة جديدة
//   const addService = async (serviceData) => {
//     try {
//       const docRef = await addDoc(collection(db, 'services'), {
//         ...serviceData,
//         createdAt: new Date().toISOString(),
//         updatedAt: new Date().toISOString(),
//       });
//       toast.success('تمت إضافة الخدمة بنجاح');
//       return docRef.id;
//     } catch (err) {
//       toast.error('فشل إضافة الخدمة: ' + err.message);
//       throw err;
//     }
//   };

//   // تحديث خدمة
//   const updateService = async (id, updatedData) => {
//     try {
//       await updateDoc(doc(db, 'services', id), {
//         ...updatedData,
//         updatedAt: new Date().toISOString(),
//       });
//       toast.success('تم تحديث الخدمة');
//     } catch (err) {
//       toast.error('فشل تحديث الخدمة: ' + err.message);
//       throw err;
//     }
//   };

//   // حذف خدمة
//   const deleteService = async (id) => {
//     try {
//       await deleteDoc(doc(db, 'services', id));
//       toast.success('تم حذف الخدمة');
//     } catch (err) {
//       toast.error('فشل حذف الخدمة: ' + err.message);
//       throw err;
//     }
//   };

//   return (
//     <ServicesContext.Provider value={{ services, loading, addService, updateService, deleteService }}>
//       {children}
//     </ServicesContext.Provider>
//   );
// }