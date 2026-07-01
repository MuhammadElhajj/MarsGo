// src/store/slices/balanceSlice.js
import { doc, onSnapshot } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../../firebase';
import toast from 'react-hot-toast';

// تهيئة دوال Firebase Functions
const functions = getFunctions();
const updateBalanceFn = httpsCallable(functions, 'updateBalance');
const buyMgcFn = httpsCallable(functions, 'buyMgc');
const sellMgcFn = httpsCallable(functions, 'sellMgc');

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

  // ===== الرصيد الحقيقي (USD) - عبر Cloud Function =====
  addBalance: async (amountUSD, reason = 'إضافة رصيد') => {
    if (amountUSD <= 0) {
      toast.error('المبلغ يجب أن يكون أكبر من صفر');
      return false;
    }
    try {
      const result = await updateBalanceFn({ amount: amountUSD, type: 'real', reason });
      if (result.data.success) {
        // تحديث الرصيد محلياً (سيتم تحديثه أيضاً عبر onSnapshot)
        set((state) => ({ balance: state.balance + amountUSD }));
        toast.success(`تم إضافة ${amountUSD.toFixed(2)} $ إلى رصيدك الحقيقي`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('فشل إضافة الرصيد الحقيقي:', error);
      toast.error(error.message || 'حدث خطأ أثناء إضافة الرصيد');
      return false;
    }
  },

  deductBalance: async (amountUSD, reason = 'خصم رصيد') => {
    if (amountUSD <= 0) {
      toast.error('المبلغ يجب أن يكون أكبر من صفر');
      return false;
    }
    const { balance } = get();
    if (balance < amountUSD) {
      toast.error(`رصيد حقيقي غير كافٍ! تحتاج ${amountUSD.toFixed(2)} $`);
      return false;
    }
    try {
      const result = await updateBalanceFn({ amount: -amountUSD, type: 'real', reason });
      if (result.data.success) {
        set((state) => ({ balance: state.balance - amountUSD }));
        toast.success(`تم خصم ${amountUSD.toFixed(2)} $ من رصيدك الحقيقي`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('فشل خصم الرصيد الحقيقي:', error);
      toast.error(error.message || 'حدث خطأ أثناء خصم الرصيد');
      return false;
    }
  },

  // ===== رصيد MGC - عبر Cloud Function =====
  addMgcBalance: async (amountMGC, reason = 'إضافة MGC') => {
    if (amountMGC <= 0) {
      toast.error('المبلغ يجب أن يكون أكبر من صفر');
      return false;
    }
    try {
      const result = await updateBalanceFn({ amount: amountMGC, type: 'mgc', reason });
      if (result.data.success) {
        set((state) => ({ mgcBalance: state.mgcBalance + amountMGC }));
        toast.success(`تم إضافة ${amountMGC.toFixed(2)} MGC إلى رصيدك`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('فشل إضافة رصيد MGC:', error);
      toast.error(error.message || 'حدث خطأ أثناء إضافة رصيد MGC');
      return false;
    }
  },

  deductMgcBalance: async (amountMGC, reason = 'خصم MGC') => {
    if (amountMGC <= 0) {
      toast.error('المبلغ يجب أن يكون أكبر من صفر');
      return false;
    }
    const { mgcBalance } = get();
    if (mgcBalance < amountMGC) {
      toast.error(`رصيد MGC غير كافٍ! تحتاج ${amountMGC} MGC`);
      return false;
    }
    try {
      const result = await updateBalanceFn({ amount: -amountMGC, type: 'mgc', reason });
      if (result.data.success) {
        set((state) => ({ mgcBalance: state.mgcBalance - amountMGC }));
        toast.success(`تم خصم ${amountMGC.toFixed(2)} MGC من رصيدك`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('فشل خصم رصيد MGC:', error);
      toast.error(error.message || 'حدث خطأ أثناء خصم رصيد MGC');
      return false;
    }
  },

  // ===== شراء MGC (تحويل USD → MGC) =====
  buyMgc: async (mgcAmount, priceUSD) => {
    if (mgcAmount <= 0 || priceUSD <= 0) {
      toast.error('البيانات غير صالحة');
      return false;
    }
    const { balance } = get();
    if (balance < priceUSD) {
      toast.error(`الرصيد غير كافٍ! تحتاج ${priceUSD.toFixed(2)} $`);
      return false;
    }
    try {
      const result = await buyMgcFn({ mgcAmount, priceUSD });
      if (result.data.success) {
        // التحديث سيتم عبر onSnapshot، لكن نحدث محلياً لتجنب الانتظار
        set((state) => ({
          balance: state.balance - priceUSD,
          mgcBalance: state.mgcBalance + mgcAmount,
        }));
        toast.success(`✅ تم شراء ${mgcAmount} MGC بنجاح!`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('فشل شراء MGC:', error);
      toast.error(error.message || 'حدث خطأ أثناء الشراء');
      return false;
    }
  },

  // ===== بيع MGC (تحويل MGC → USD) =====
  sellMgc: async (mgcAmount) => {
    if (mgcAmount <= 0) {
      toast.error('الكمية يجب أن تكون أكبر من صفر');
      return false;
    }
    const { mgcBalance } = get();
    if (mgcBalance < mgcAmount) {
      toast.error(`رصيد MGC غير كافٍ! لديك ${mgcBalance} MGC فقط`);
      return false;
    }
    try {
      const result = await sellMgcFn({ mgcAmount });
      if (result.data.success) {
        // التحديث سيتم عبر onSnapshot
        toast.success(`✅ تم بيع ${mgcAmount} MGC بنجاح!`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('فشل بيع MGC:', error);
      toast.error(error.message || 'حدث خطأ أثناء البيع');
      return false;
    }
  },

  // ===== دوال مساعدة =====
  getBalance: () => get().balance,
  getMgcBalance: () => get().mgcBalance,
});