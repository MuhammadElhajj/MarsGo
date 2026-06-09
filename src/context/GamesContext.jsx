import { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { uploadImage, deleteImage } from '../utils/uploadImage';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

const GamesContext = createContext();

export function useGames() {
  return useContext(GamesContext);
}

export function GamesProvider({ children }) {
  const { user } = useAuth();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // جلب جميع الألعاب
  const fetchGames = async () => {
    if (!user) {
      setGames([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, 'games'), orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      const gamesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGames(gamesList);
    } catch (err) {
      console.error('خطأ في جلب الألعاب:', err);
      setError(err.message);
      toast.error('فشل تحميل الألعاب');
    } finally {
      setLoading(false);
    }
  };

  // جلب باقات لعبة محددة
  const fetchPackages = async (gameId) => {
    if (!gameId) return [];
    try {
      const q = query(collection(db, 'games', gameId, 'packages'), orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error('خطأ في جلب الباقات:', err);
      toast.error('فشل تحميل الباقات');
      return [];
    }
  };

  // دالة مساعدة لرفع صورة اللعبة
  const uploadGameImage = async (gameId, base64Image) => {
    if (!base64Image) return null;
    const path = `games/${gameId}/main_${Date.now()}.jpg`;
    const url = await uploadImage(base64Image, path);
    return url;
  };

  // دالة مساعدة لرفع صورة الباقة
  const uploadPackageImage = async (gameId, packageId, base64Image) => {
    if (!base64Image) return null;
    const path = `games/${gameId}/packages/${packageId}/main_${Date.now()}.jpg`;
    const url = await uploadImage(base64Image, path);
    return url;
  };

  // إضافة لعبة جديدة (تدعم imageBase64 أو imageUrl)
  const addGame = async (gameData) => {
    // استخراج الصورة المؤقتة إن وجدت
    const { imageBase64, imageUrl, ...restData } = gameData;
    const tempImageBase64 = imageBase64 || (imageUrl ? null : null); // إذا أرسل imageUrl فقط نتعامل معه

    try {
      // 1. إنشاء المستند أولاً بدون الصورة النهائية
      const docRef = await addDoc(collection(db, 'games'), {
        ...restData,
        imageUrl: null, // سيتم تحديثه لاحقاً
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const gameId = docRef.id;

      // 2. رفع الصورة إن وجدت
      let finalImageUrl = null;
      if (tempImageBase64) {
        finalImageUrl = await uploadGameImage(gameId, tempImageBase64);
      } else if (imageUrl) {
        finalImageUrl = imageUrl; // إذا كان الرابط موجوداً (مثلاً من تعديل)
      }

      // 3. تحديث المستند بالرابط
      if (finalImageUrl) {
        await updateDoc(doc(db, 'games', gameId), { imageUrl: finalImageUrl });
      }

      toast.success('تمت إضافة اللعبة بنجاح');
      await fetchGames();
      return gameId;
    } catch (err) {
      console.error(err);
      toast.error('فشل إضافة اللعبة: ' + err.message);
      throw err;
    }
  };

  // تحديث لعبة (مع معالجة الصورة)
  const updateGame = async (gameId, gameData) => {
    const oldGame = games.find(g => g.id === gameId);
    const { imageBase64, imageUrl, ...restData } = gameData;
    let newImageUrl = imageUrl;

    try {
      // إذا كانت هناك صورة جديدة بصيغة base64 نرفعها
      if (imageBase64) {
        // حذف الصورة القديمة إن وجدت
        if (oldGame?.imageUrl) {
          await deleteImage(oldGame.imageUrl);
        }
        newImageUrl = await uploadGameImage(gameId, imageBase64);
      } else if (imageUrl && imageUrl !== oldGame?.imageUrl) {
        // إذا تم تغيير الرابط إلى رابط جديد (من مصدر آخر) نحذف القديم
        if (oldGame?.imageUrl) {
          await deleteImage(oldGame.imageUrl);
        }
        newImageUrl = imageUrl;
      }

      await updateDoc(doc(db, 'games', gameId), {
        ...restData,
        ...(newImageUrl && { imageUrl: newImageUrl }),
        updatedAt: new Date(),
      });
      toast.success('تم تحديث اللعبة بنجاح');
      await fetchGames();
    } catch (err) {
      console.error(err);
      toast.error('فشل تحديث اللعبة: ' + err.message);
      throw err;
    }
  };

  // حذف لعبة (مع حذف صورتها وصور جميع باقاتها من Storage)
  const deleteGame = async (gameId) => {
    try {
      // 1. حذف صورة اللعبة من Storage
      const game = games.find(g => g.id === gameId);
      if (game?.imageUrl) {
        await deleteImage(game.imageUrl);
      }

      // 2. جلب الباقات وحذف صورها
      const packagesSnap = await getDocs(collection(db, 'games', gameId, 'packages'));
      for (const pkgDoc of packagesSnap.docs) {
        const pkgData = pkgDoc.data();
        if (pkgData.imageUrl) {
          await deleteImage(pkgData.imageUrl);
        }
        // حذف الباقة
        await deleteDoc(doc(db, 'games', gameId, 'packages', pkgDoc.id));
      }

      // 3. حذف اللعبة
      await deleteDoc(doc(db, 'games', gameId));
      toast.success('تم حذف اللعبة وجميع باقاتها');
      await fetchGames();
    } catch (err) {
      console.error(err);
      toast.error('فشل حذف اللعبة: ' + err.message);
      throw err;
    }
  };

  // إضافة باقة إلى لعبة (مع رفع صورة)
  const addPackage = async (gameId, packageData) => {
    const { imageBase64, imageUrl, ...restData } = packageData;

    try {
      // إنشاء الباقة أولاً
      const docRef = await addDoc(collection(db, 'games', gameId, 'packages'), {
        ...restData,
        imageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const packageId = docRef.id;

      let finalImageUrl = null;
      if (imageBase64) {
        finalImageUrl = await uploadPackageImage(gameId, packageId, imageBase64);
      } else if (imageUrl) {
        finalImageUrl = imageUrl;
      }

      if (finalImageUrl) {
        await updateDoc(doc(db, 'games', gameId, 'packages', packageId), { imageUrl: finalImageUrl });
      }

      toast.success('تمت إضافة الباقة بنجاح');
      return packageId;
    } catch (err) {
      console.error(err);
      toast.error('فشل إضافة الباقة: ' + err.message);
      throw err;
    }
  };

  // تحديث باقة (مع معالجة الصورة)
  const updatePackage = async (gameId, packageId, packageData) => {
    // جلب الباقة القديمة (للحصول على الصورة القديمة) – نستخدم fetchPackages للحصول عليها إذا لزم الأمر
    let oldImageUrl = null;
    try {
      const packages = await fetchPackages(gameId);
      const oldPkg = packages.find(p => p.id === packageId);
      oldImageUrl = oldPkg?.imageUrl;
    } catch (e) { /* تجاهل */ }

    const { imageBase64, imageUrl, ...restData } = packageData;
    let newImageUrl = imageUrl;

    try {
      if (imageBase64) {
        if (oldImageUrl) await deleteImage(oldImageUrl);
        newImageUrl = await uploadPackageImage(gameId, packageId, imageBase64);
      } else if (imageUrl && imageUrl !== oldImageUrl) {
        if (oldImageUrl) await deleteImage(oldImageUrl);
        newImageUrl = imageUrl;
      }

      await updateDoc(doc(db, 'games', gameId, 'packages', packageId), {
        ...restData,
        ...(newImageUrl && { imageUrl: newImageUrl }),
        updatedAt: new Date(),
      });
      toast.success('تم تحديث الباقة بنجاح');
    } catch (err) {
      console.error(err);
      toast.error('فشل تحديث الباقة: ' + err.message);
      throw err;
    }
  };

  // حذف باقة (مع حذف صورتها)
  const deletePackage = async (gameId, packageId) => {
    try {
      // جلب الباقة لمعرفة رابط الصورة
      const packages = await fetchPackages(gameId);
      const pkg = packages.find(p => p.id === packageId);
      if (pkg?.imageUrl) {
        await deleteImage(pkg.imageUrl);
      }
      await deleteDoc(doc(db, 'games', gameId, 'packages', packageId));
      toast.success('تم حذف الباقة بنجاح');
    } catch (err) {
      console.error(err);
      toast.error('فشل حذف الباقة: ' + err.message);
      throw err;
    }
  };

  useEffect(() => {
    fetchGames();
  }, [user]);

  const value = {
    games,
    loading,
    error,
    fetchGames,
    fetchPackages,
    addGame,
    updateGame,
    deleteGame,
    addPackage,
    updatePackage,
    deletePackage,
  };

  return <GamesContext.Provider value={value}>{children}</GamesContext.Provider>;
}