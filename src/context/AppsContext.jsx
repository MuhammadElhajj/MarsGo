// context/AppsContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { uploadImage, deleteImage } from '../utils/uploadImage';
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

  // دالة مساعدة لرفع صورة التطبيق
  const uploadAppImage = async (appId, base64Image) => {
    if (!base64Image) return null;
    const path = `apps/${appId}/main_${Date.now()}.jpg`;
    const url = await uploadImage(base64Image, path);
    return url;
  };

  // دالة مساعدة لرفع صورة الباقة
  const uploadPackageImage = async (appId, packageId, base64Image) => {
    if (!base64Image) return null;
    const path = `apps/${appId}/packages/${packageId}/main_${Date.now()}.jpg`;
    const url = await uploadImage(base64Image, path);
    return url;
  };

  // إضافة تطبيق جديد
  const addApp = async (appData) => {
    const { imageBase64, imageUrl, ...restData } = appData;
    const tempImageBase64 = imageBase64 || (imageUrl ? null : null);

    try {
      const docRef = await addDoc(collection(db, 'apps'), {
        ...restData,
        imageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const appId = docRef.id;

      let finalImageUrl = null;
      if (tempImageBase64) {
        finalImageUrl = await uploadAppImage(appId, tempImageBase64);
      } else if (imageUrl) {
        finalImageUrl = imageUrl;
      }

      if (finalImageUrl) {
        await updateDoc(doc(db, 'apps', appId), { imageUrl: finalImageUrl });
      }

      toast.success('تمت إضافة التطبيق بنجاح');
      await fetchApps();
      return appId;
    } catch (err) {
      console.error(err);
      toast.error('فشل إضافة التطبيق: ' + err.message);
      throw err;
    }
  };

  // تحديث تطبيق
  const updateApp = async (appId, appData) => {
    const oldApp = apps.find(a => a.id === appId);
    const { imageBase64, imageUrl, ...restData } = appData;
    let newImageUrl = imageUrl;

    try {
      if (imageBase64) {
        if (oldApp?.imageUrl) await deleteImage(oldApp.imageUrl);
        newImageUrl = await uploadAppImage(appId, imageBase64);
      } else if (imageUrl && imageUrl !== oldApp?.imageUrl) {
        if (oldApp?.imageUrl) await deleteImage(oldApp.imageUrl);
        newImageUrl = imageUrl;
      }

      await updateDoc(doc(db, 'apps', appId), {
        ...restData,
        ...(newImageUrl && { imageUrl: newImageUrl }),
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

  // حذف تطبيق وجميع بقاته (مع حذف الصور)
  const deleteApp = async (appId) => {
    try {
      // حذف صورة التطبيق
      const app = apps.find(a => a.id === appId);
      if (app?.imageUrl) await deleteImage(app.imageUrl);

      // حذف الباقات وصورها
      const packagesSnap = await getDocs(collection(db, 'apps', appId, 'packages'));
      for (const pkgDoc of packagesSnap.docs) {
        const pkgData = pkgDoc.data();
        if (pkgData.imageUrl) await deleteImage(pkgData.imageUrl);
        await deleteDoc(doc(db, 'apps', appId, 'packages', pkgDoc.id));
      }

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

  // ✅ إضافة باقة إلى تطبيق (مع دعم الحقول الجديدة)
  const addPackage = async (appId, packageData) => {
    const { imageBase64, imageUrl, externalProductId, externalAnyKey, ...restData } = packageData;

    try {
      const docRef = await addDoc(collection(db, 'apps', appId, 'packages'), {
        ...restData,
        imageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        externalProductId: externalProductId ? Number(externalProductId) : null,
        externalAnyKey: externalAnyKey || '',
      });
      const packageId = docRef.id;

      let finalImageUrl = null;
      if (imageBase64) {
        finalImageUrl = await uploadPackageImage(appId, packageId, imageBase64);
      } else if (imageUrl) {
        finalImageUrl = imageUrl;
      }

      if (finalImageUrl) {
        await updateDoc(doc(db, 'apps', appId, 'packages', packageId), { imageUrl: finalImageUrl });
      }

      toast.success('تمت إضافة الباقة بنجاح');
      return packageId;
    } catch (err) {
      console.error(err);
      toast.error('فشل إضافة الباقة: ' + err.message);
      throw err;
    }
  };

  // ✅ تحديث باقة (مع دعم الحقول الجديدة)
  const updatePackage = async (appId, packageId, packageData) => {
    let oldImageUrl = null;
    try {
      const packages = await fetchPackages(appId);
      const oldPkg = packages.find(p => p.id === packageId);
      oldImageUrl = oldPkg?.imageUrl;
    } catch (e) { /* تجاهل */ }

    const { imageBase64, imageUrl, externalProductId, externalAnyKey, ...restData } = packageData;
    let newImageUrl = imageUrl;

    try {
      if (imageBase64) {
        if (oldImageUrl) await deleteImage(oldImageUrl);
        newImageUrl = await uploadPackageImage(appId, packageId, imageBase64);
      } else if (imageUrl && imageUrl !== oldImageUrl) {
        if (oldImageUrl) await deleteImage(oldImageUrl);
        newImageUrl = imageUrl;
      }

      await updateDoc(doc(db, 'apps', appId, 'packages', packageId), {
        ...restData,
        ...(newImageUrl && { imageUrl: newImageUrl }),
        updatedAt: new Date(),
        externalProductId: externalProductId ? Number(externalProductId) : null,
        externalAnyKey: externalAnyKey || '',
      });
      toast.success('تم تحديث الباقة بنجاح');
    } catch (err) {
      console.error(err);
      toast.error('فشل تحديث الباقة: ' + err.message);
      throw err;
    }
  };

  // حذف باقة (مع حذف صورتها)
  const deletePackage = async (appId, packageId) => {
    try {
      const packages = await fetchPackages(appId);
      const pkg = packages.find(p => p.id === packageId);
      if (pkg?.imageUrl) await deleteImage(pkg.imageUrl);
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