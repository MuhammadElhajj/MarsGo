// src/store/slices/authSlice.js
import { doc, runTransaction, query, collection, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import toast from 'react-hot-toast';

export const createAuthSlice = (set, get) => ({
  // ===== الحالات =====
  user: null,
  userData: null,

  // ===== الإعدادات =====
  setUser: (user) => set({ user }),
  setUserData: (data) => set({
    userData: data,
    user: data?.user || data,
    balance: data?.balance || 0,
    mgcBalance: data?.mgcBalance || 0,
    referralBalance: data?.referralBalance || 0,
  }),
  setUserFull: (userData) => set({
    user: userData,
    userData: userData,
    balance: userData?.balance || 0,
    mgcBalance: userData?.mgcBalance || 0,
    referralBalance: userData?.referralBalance || 0,
  }),

  // ===== نظام المعرف الفريد =====
  generateUniqueId: async () => {
    const counterRef = doc(db, 'app_metadata', 'counters');
    try {
      const result = await runTransaction(db, async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        let newCount = 1;
        if (!counterDoc.exists()) {
          transaction.set(counterRef, { uniqueIdCounter: 1 });
        } else {
          const currentCount = counterDoc.data().uniqueIdCounter || 0;
          newCount = currentCount + 1;
          transaction.update(counterRef, { uniqueIdCounter: newCount });
        }
        return newCount;
      });
      const paddedNumber = String(result).padStart(8, '0');
      return `MGC_${paddedNumber}`;
    } catch (error) {
      console.error('فشل توليد المعرف الفريد:', error);
      return `MGC_${Date.now().toString().slice(-8)}`;
    }
  },

  // ===== البحث عن مستخدم بواسطة المعرف الفريد (مع تجاهل أخطاء الصلاحية) =====
  searchByUniqueId: async (uniqueId) => {
    if (!uniqueId || uniqueId.length < 3) {
      toast.error('الرجاء إدخال معرف صحيح (مثل: NE1234)');
      return null;
    }
    try {
      const q = query(collection(db, 'users'), where('uniqueId', '==', uniqueId));
      const snap = await getDocs(q);
      if (snap.empty) {
        toast.error('لا يوجد مستخدم بهذا المعرف');
        return null;
      }
      return { id: snap.docs[0].id, ...snap.docs[0].data() };
    } catch (error) {
      // تجاهل خطأ الصلاحية وعدم طباعته في الكونسول
      if (error.code === 'permission-denied' || error.message?.includes('Missing or insufficient permissions')) {
        toast.error('لا يمكنك البحث عن مستخدمين آخرين حالياً');
        return null;
      }
      console.error('خطأ في البحث:', error);
      toast.error('حدث خطأ أثناء البحث');
      return null;
    }
  },

  // ===== البحث عن المستخدمين ببادئة (مع تجاهل أخطاء الصلاحية) =====
  searchUsersByPrefix: async (prefix) => {
    if (!prefix || prefix.length < 2) return [];
    try {
      const startId = `MGC_${prefix}`;
      const endId = `MGC_${prefix}\uf8ff`;
      const q = query(
        collection(db, 'users'),
        where('uniqueId', '>=', startId),
        where('uniqueId', '<=', endId),
        orderBy('uniqueId'),
        limit(10)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      // تجاهل خطأ الصلاحية وعدم طباعته في الكونسول
      if (error.code === 'permission-denied' || error.message?.includes('Missing or insufficient permissions')) {
        return [];
      }
      console.error('خطأ في البحث بالبادئة:', error);
      return [];
    }
  },
});