// src/store/slices/balanceSlice.js
import { doc, updateDoc, increment, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import toast from 'react-hot-toast';

export const createBalanceSlice = (set, get) => ({
  // ===== الحالات =====
  balance: 0,
  mgcBalance: 0,
  referralBalance: 0,

  // ===== الإعدادات =====
  setBalance: (balance) => set({ balance }),
  setMgcBalance: (mgcBalance) => set({ mgcBalance }),
  setReferralBalance: (referralBalance) => set({ referralBalance }),

  // ===== الاستماع للرصيد =====
  listenToBalance: (userId) => {
    if (!userId) return () => {};
    const userRef = doc(db, 'users', userId);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        set({
          balance: data.balance || 0,
          mgcBalance: data.mgcBalance || 0,
          referralBalance: data.referralBalance || 0,
        });
      }
    }, (error) => {
      console.error('خطأ في الاستماع للرصيد:', error);
    });
    return unsubscribe;
  },

  // ===== الرصيد الحقيقي (USD) =====
  addBalance: async (userId, amountUSD) => {
    if (amountUSD <= 0) return false;
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { balance: increment(amountUSD) });
      set((state) => ({ balance: state.balance + amountUSD }));
      toast.success(`تم إضافة ${amountUSD.toFixed(2)} $ إلى رصيدك الحقيقي`);
      return true;
    } catch (error) {
      console.error('فشل إضافة الرصيد الحقيقي:', error);
      toast.error('حدث خطأ أثناء إضافة الرصيد');
      return false;
    }
  },

  deductBalance: async (amountUSD) => {
    const { user, balance } = get();
    if (balance < amountUSD) {
      toast.error(`رصيد حقيقي غير كافٍ! تحتاج ${amountUSD.toFixed(2)} $`);
      return false;
    }
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { balance: increment(-amountUSD) });
      set((state) => ({ balance: state.balance - amountUSD }));
      toast.success(`تم خصم ${amountUSD.toFixed(2)} $ من رصيدك الحقيقي`);
      return true;
    } catch (error) {
      console.error('فشل خصم الرصيد الحقيقي:', error);
      toast.error('حدث خطأ أثناء خصم الرصيد');
      return false;
    }
  },

  // ===== رصيد MGC =====
  addMgcBalance: async (userId, amountMGC) => {
    if (amountMGC <= 0) return false;
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { mgcBalance: increment(amountMGC) });
      set((state) => ({ mgcBalance: state.mgcBalance + amountMGC }));
      toast.success(`تم إضافة ${amountMGC.toFixed(2)} MGC إلى رصيدك`);
      return true;
    } catch (error) {
      console.error('فشل إضافة رصيد MGC:', error);
      toast.error('حدث خطأ أثناء إضافة رصيد MGC');
      return false;
    }
  },

  deductMgcBalance: async (amountMGC) => {
    const { user, mgcBalance } = get();
    if (mgcBalance < amountMGC) {
      toast.error(`رصيد MGC غير كافٍ! تحتاج ${amountMGC} MGC`);
      return false;
    }
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { mgcBalance: increment(-amountMGC) });
      set((state) => ({ mgcBalance: state.mgcBalance - amountMGC }));
      toast.success(`تم خصم ${amountMGC.toFixed(2)} MGC من رصيدك`);
      return true;
    } catch (error) {
      console.error('فشل خصم رصيد MGC:', error);
      toast.error('حدث خطأ أثناء خصم رصيد MGC');
      return false;
    }
  },

  // ===== دوال مساعدة =====
  getBalance: () => get().balance,
  getMgcBalance: () => get().mgcBalance,
});