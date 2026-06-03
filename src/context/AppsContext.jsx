// context/AppsContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const AppsContext = createContext();

export function useApps() {
  return useContext(AppsContext);
}

export function AppsProvider({ children }) {
  const { user } = useAuth();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchApps = async () => {
    if (!user) {
      setApps([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const q = query(collection(db, 'apps'), orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      setApps(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error(err);
      toast.error('فشل تحميل التطبيقات');
    } finally {
      setLoading(false);
    }
  };

  const fetchPackages = async (appId) => {
    try {
      const q = query(collection(db, 'apps', appId, 'packages'), orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  // إضافة تطبيق جديد
  const addApp = async (appData) => {
    try {
      const docRef = await addDoc(collection(db, 'apps'), {
        ...appData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      toast.success('تمت إضافة التطبيق بنجاح');
      await fetchApps();
      return docRef.id;
    } catch (err) {
      console.error(err);
      toast.error('فشل إضافة التطبيق: ' + err.message);
      throw err;
    }
  };

  // تحديث تطبيق
  const updateApp = async (appId, appData) => {
    try {
      await updateDoc(doc(db, 'apps', appId), {
        ...appData,
        updatedAt: new Date(),
      });
      toast.success('تم تحديث التطبيق بنجاح');
      await fetchApps();
    } catch (err) {
      console.error(err);
      toast.error('فشل تحديث التطبيق: ' + err.message);
      throw err;
    }
  };

  // حذف تطبيق وجميع بقاته
  const deleteApp = async (appId) => {
    try {
      // حذف الباقات أولاً
      const packagesSnap = await getDocs(collection(db, 'apps', appId, 'packages'));
      const deletePromises = packagesSnap.docs.map(pkgDoc =>
        deleteDoc(doc(db, 'apps', appId, 'packages', pkgDoc.id))
      );
      await Promise.all(deletePromises);
      // حذف التطبيق
      await deleteDoc(doc(db, 'apps', appId));
      toast.success('تم حذف التطبيق وجميع بقاته');
      await fetchApps();
    } catch (err) {
      console.error(err);
      toast.error('فشل حذف التطبيق: ' + err.message);
      throw err;
    }
  };

  // إضافة باقة إلى تطبيق
  const addPackage = async (appId, packageData) => {
    try {
      const docRef = await addDoc(collection(db, 'apps', appId, 'packages'), {
        ...packageData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      toast.success('تمت إضافة الباقة بنجاح');
      return docRef.id;
    } catch (err) {
      console.error(err);
      toast.error('فشل إضافة الباقة: ' + err.message);
      throw err;
    }
  };

  // تحديث باقة
  const updatePackage = async (appId, packageId, packageData) => {
    try {
      await updateDoc(doc(db, 'apps', appId, 'packages', packageId), {
        ...packageData,
        updatedAt: new Date(),
      });
      toast.success('تم تحديث الباقة بنجاح');
    } catch (err) {
      console.error(err);
      toast.error('فشل تحديث الباقة: ' + err.message);
      throw err;
    }
  };

  // حذف باقة
  const deletePackage = async (appId, packageId) => {
    try {
      await deleteDoc(doc(db, 'apps', appId, 'packages', packageId));
      toast.success('تم حذف الباقة بنجاح');
    } catch (err) {
      console.error(err);
      toast.error('فشل حذف الباقة: ' + err.message);
      throw err;
    }
  };

  useEffect(() => {
    fetchApps();
  }, [user]);

  const value = {
    apps,
    loading,
    fetchApps,
    fetchPackages,
    addApp,
    updateApp,
    deleteApp,
    addPackage,
    updatePackage,
    deletePackage,
  };

  return <AppsContext.Provider value={value}>{children}</AppsContext.Provider>;
}