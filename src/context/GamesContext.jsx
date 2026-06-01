import { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
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

  // إضافة لعبة جديدة
  const addGame = async (gameData) => {
    try {
      const docRef = await addDoc(collection(db, 'games'), {
        ...gameData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      toast.success('تمت إضافة اللعبة بنجاح');
      await fetchGames(); // تحديث القائمة
      return docRef.id;
    } catch (err) {
      console.error(err);
      toast.error('فشل إضافة اللعبة: ' + err.message);
      throw err;
    }
  };

  // تحديث لعبة
  const updateGame = async (gameId, gameData) => {
    try {
      await updateDoc(doc(db, 'games', gameId), {
        ...gameData,
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

  // حذف لعبة وجميع باقاتها
  const deleteGame = async (gameId) => {
    try {
      // حذف الباقات أولاً
      const packagesSnap = await getDocs(collection(db, 'games', gameId, 'packages'));
      const deletePromises = packagesSnap.docs.map(pkgDoc => deleteDoc(doc(db, 'games', gameId, 'packages', pkgDoc.id)));
      await Promise.all(deletePromises);
      // حذف اللعبة
      await deleteDoc(doc(db, 'games', gameId));
      toast.success('تم حذف اللعبة وجميع باقاتها');
      await fetchGames();
    } catch (err) {
      console.error(err);
      toast.error('فشل حذف اللعبة: ' + err.message);
      throw err;
    }
  };

  // إضافة باقة إلى لعبة
  const addPackage = async (gameId, packageData) => {
    try {
      const docRef = await addDoc(collection(db, 'games', gameId, 'packages'), {
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
  const updatePackage = async (gameId, packageId, packageData) => {
    try {
      await updateDoc(doc(db, 'games', gameId, 'packages', packageId), {
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
  const deletePackage = async (gameId, packageId) => {
    try {
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