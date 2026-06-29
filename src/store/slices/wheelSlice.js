// src/store/slices/wheelSlice.js
import { doc, updateDoc, addDoc, collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../../firebase';
import toast from 'react-hot-toast';

// ===== إعدادات الدولاب =====
const SPIN_COST = 25; // تكلفة الدوران (MGC)

// ===== توزيع الجوائز حسب النظام الجديد =====
// 70% من الجوائز توزع على 400 دورة (من 0.5 إلى 32)
// 30% من الجوائز توزع على 100 دورة (من 50 إلى 500)
// إجمالي 500 دورة
const WHEEL_SEGMENTS = [
  // 70% من الوزن (35%) موزع على القيم الصغيرة
  { value: 0.5, weight: 5 },   // 5%
  { value: 1, weight: 8 },     // 8%
  { value: 2, weight: 10 },    // 10%
  { value: 4, weight: 12 },    // 12%
  { value: 8, weight: 15 },    // 15%
  { value: 16, weight: 10 },   // 10%
  { value: 32, weight: 10 },   // 10%
  // 30% من الوزن (15%) موزع على القيم الكبيرة
  { value: 50, weight: 5 },    // 5%
  { value: 100, weight: 4 },   // 4%
  { value: 200, weight: 3 },   // 3%
  { value: 500, weight: 3 },   // 3%
];

// ===== ماكينة الحظ =====
const MACHINE_SPIN_COST = 25; // تكلفة السحب

const MACHINE_REWARDS = [
  { label: 'لا شيء', value: 0, weight: 30, isFail: true },
  { label: '1 MGC', value: 1, weight: 15 },
  { label: '2 MGC', value: 2, weight: 12 },
  { label: '3 MGC', value: 3, weight: 10 },
  { label: '5 MGC', value: 5, weight: 8 },
  { label: '8 MGC', value: 8, weight: 6 },
  { label: '10 MGC', value: 10, weight: 5 },
  { label: '15 MGC', value: 15, weight: 3 },
  { label: '20 MGC', value: 20, weight: 2 },
  { label: '50 MGC', value: 50, weight: 1 },
  { label: 'خصم 5%', value: 0, weight: 3, isCoupon: true, couponValue: 5 },
  { label: 'خصم 10%', value: 0, weight: 2, isCoupon: true, couponValue: 10 },
  { label: '+50 XP', value: 0, weight: 2, isXP: true, xpValue: 50 },
  { label: '+100 XP', value: 0, weight: 1, isXP: true, xpValue: 100 },
  { label: 'كوبون 1$', value: 0, weight: 1, isFreeCoupon: true, couponAmount: 1 },
  { label: 'كوبون 2$', value: 0, weight: 0.5, isFreeCoupon: true, couponAmount: 2 },
  { label: 'كوبون 5$', value: 0, weight: 0.2, isFreeCoupon: true, couponAmount: 5 },
  { label: 'لقب جديد', value: 0, weight: 0.3, isTitle: true },
];

const PITY_REWARDS = [
  { label: 'خصم 10%', isCoupon: true, couponValue: 10, weight: 25 },
  { label: '+100 XP', isXP: true, xpValue: 100, weight: 25 },
  { label: 'كوبون 1$', isFreeCoupon: true, couponAmount: 1, weight: 20 },
  { label: 'كوبون 2$', isFreeCoupon: true, couponAmount: 2, weight: 15 },
  { label: 'كوبون 5$', isFreeCoupon: true, couponAmount: 5, weight: 10 },
  { label: 'لقب نادر', isTitle: true, weight: 5 },
];

const LEVEL_TITLES = {
  1: 'مبتدئ', 2: 'مستكشف', 3: 'مغامر', 4: 'الشاطر',
  5: 'بطل', 6: 'أسطورة', 7: 'محارب', 8: 'الحاج',
  9: 'سيد', 10: 'ملكي',
};

function calculateLevel(xp) {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

function getTitleByLevel(level) {
  return LEVEL_TITLES[level] || LEVEL_TITLES[1];
}

export const createWheelSlice = (set, get) => ({
  // ===== دولاب الحظ (عبر Cloud Function) =====
  spinWheel: async () => {
    const { user, mgcBalance } = get();
    
    // التحقق من الرصيد في الواجهة (لتحسين تجربة المستخدم)
    if (mgcBalance < SPIN_COST) {
      toast.error(`رصيد MGC غير كافٍ! تحتاج ${SPIN_COST} MGC`);
      return { success: false, prize: null, index: -1, message: 'رصيد MGC غير كافٍ' };
    }

    try {
      const functions = getFunctions();
      const spinFn = httpsCallable(functions, 'spinWheel');
      const result = await spinFn();

      if (result.data.success) {
        const { prize, index } = result.data;
        // تحديث الرصيد محلياً (سيتم تحديثه عبر onSnapshot أيضاً)
        const newMgcBalance = get().mgcBalance - SPIN_COST + prize;
        set({ mgcBalance: newMgcBalance });
        // تحديث userData إذا لزم الأمر
        if (get().userData) {
          set({
            userData: {
              ...get().userData,
              mgcBalance: newMgcBalance,
            }
          });
        }
        return { success: true, prize, index };
      } else {
        toast.error(result.data.message || 'فشل الدوران');
        return { success: false, prize: null, index: -1, message: result.data.message };
      }
    } catch (error) {
      console.error('❌ فشل spinWheel:', error);
      toast.error(error.message || 'حدث خطأ أثناء الدوران');
      return { success: false, prize: null, index: -1, message: error.message };
    }
  },

  // ===== جلب تاريخ الدولاب =====
  fetchWheelHistory: async (userId = null) => {
    try {
      const { collection, getDocs, query, where, orderBy, limit } = await import('firebase/firestore');
      const { db } = await import('../../firebase');
      let q = query(collection(db, 'wheelHistory'), orderBy('timestamp', 'desc'), limit(50));
      if (userId) {
        q = query(q, where('userId', '==', userId));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('فشل جلب تاريخ الدولاب:', error);
      return [];
    }
  },

  // ===== ماكينة الحظ (عبر Cloud Function) =====
  pullMachine: async () => {
    const { user, mgcBalance, userData } = get();

    // التحقق من الرصيد في الواجهة (لتحسين تجربة المستخدم)
    if (mgcBalance < MACHINE_SPIN_COST) {
      toast.error(`رصيد MGC غير كافٍ! تحتاج ${MACHINE_SPIN_COST} MGC`);
      return { success: false, error: 'رصيد MGC غير كافٍ' };
    }

    try {
      const functions = getFunctions();
      const pullFn = httpsCallable(functions, 'pullMachine');
      const result = await pullFn();

      if (result.data.success) {
        const { reward, prizeMessage, prizeValue, isPity, pityCounter } = result.data;
        
        // تحديث الرصيد محلياً
        const newMgcBalance = get().mgcBalance - MACHINE_SPIN_COST + prizeValue;
        set({ mgcBalance: newMgcBalance });
        
        // تحديث userData إذا لزم الأمر
        if (get().userData) {
          set({
            userData: {
              ...get().userData,
              mgcBalance: newMgcBalance,
              pityCounter: pityCounter,
              ...(result.data.xpGained && {
                xp: (get().userData?.xp || 0) + result.data.xpGained,
                level: result.data.newLevel || get().userData?.level,
                title: result.data.newTitle || get().userData?.title,
              }),
              ...(result.data.coupons && { coupons: result.data.coupons }),
              ...(result.data.freeCoupons && { freeCoupons: result.data.freeCoupons }),
            }
          });
        }

        // عرض رسالة النجاح
        toast.success(prizeMessage || `🎉 ربحت ${prizeValue} MGC!`);
        
        return {
          success: true,
          reward,
          prizeMessage,
          prizeValue,
          isPity,
          pityCounter,
        };
      } else {
        toast.error(result.data.error || 'فشل السحب');
        return { success: false, error: result.data.error };
      }
    } catch (error) {
      console.error('❌ فشل pullMachine:', error);
      toast.error(error.message || 'حدث خطأ أثناء السحب');
      return { success: false, error: error.message };
    }
  },

  // ===== إحصائيات =====
  getWheelCount: async () => {
    const { user } = get();
    if (!user) return 0;
    try {
      const q = query(collection(db, 'wheelHistory'), where('userId', '==', user.uid));
      const snap = await getDocs(q);
      return snap.size;
    } catch { return 0; }
  },

  getMachineCount: async () => {
    const { user } = get();
    if (!user) return 0;
    try {
      const q = query(collection(db, 'machineHistory'), where('userId', '==', user.uid));
      const snap = await getDocs(q);
      return snap.size;
    } catch { return 0; }
  },
});