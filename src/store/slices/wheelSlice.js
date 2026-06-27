// src/store/slices/wheelSlice.js
import { doc, updateDoc, addDoc, collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import toast from 'react-hot-toast';

// ===== القطاعات الثابتة =====
const WHEEL_SEGMENTS = [
  { value: 0.5, weight: 35 },
  { value: 0.5, weight: 35 },
  { value: 1.5, weight: 15 },
  { value: 3, weight: 8 },
  { value: 7, weight: 4 },
  { value: 15, weight: 2 },
  { value: 50, weight: 0.8 },
  { value: 500, weight: 0.2 },
];

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

function getRandomReward(rewardsArray) {
  const totalWeight = rewardsArray.reduce((sum, r) => sum + r.weight, 0);
  let random = Math.random() * totalWeight;
  for (const reward of rewardsArray) {
    random -= reward.weight;
    if (random <= 0) return reward;
  }
  return rewardsArray[0];
}

function calculateLevel(xp) {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

function getTitleByLevel(level) {
  return LEVEL_TITLES[level] || LEVEL_TITLES[1];
}

export const createWheelSlice = (set, get) => ({
  spinWheel: async () => {
    const { user, mgcBalance } = get();
    const SPIN_COST = 0.25;
    if (mgcBalance < SPIN_COST) {
      toast.error(`رصيد MGC غير كافٍ! تحتاج ${SPIN_COST} MGC`);
      return { success: false, prize: null, index: -1, message: 'رصيد MGC غير كافٍ' };
    }
    const getRandomIndex = () => {
      const totalWeight = WHEEL_SEGMENTS.reduce((sum, seg) => sum + seg.weight, 0);
      let random = Math.random() * totalWeight;
      for (let i = 0; i < WHEEL_SEGMENTS.length; i++) {
        random -= WHEEL_SEGMENTS[i].weight;
        if (random <= 0) return i;
      }
      return 0;
    };
    const selectedIndex = getRandomIndex();
    const prize = WHEEL_SEGMENTS[selectedIndex].value;
    const deductSuccess = await get().deductMgcBalance(SPIN_COST);
    if (!deductSuccess) {
      return { success: false, prize: null, index: -1, message: 'فشل الخصم' };
    }
    if (prize > 0) {
      const addSuccess = await get().addMgcBalance(user.uid, prize);
      if (!addSuccess) {
        toast.error('فشل إضافة الجائزة، يرجى التواصل مع الدعم');
        return { success: false, prize: null, index: -1, message: 'فشل إضافة الجائزة' };
      }
    }
    try {
      const { collection, addDoc } = await import('firebase/firestore');
      const { db } = await import('../../firebase');
      await addDoc(collection(db, 'wheelHistory'), {
        userId: user.uid,
        username: user.displayName || 'مستخدم',
        prize: prize,
        cost: SPIN_COST,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.warn('فشل تسجيل تاريخ الدوران:', error);
    }
    return { success: true, prize, index: selectedIndex };
  },

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

  pullMachine: async () => {
    const { user, mgcBalance, userData } = get();
    const SPIN_COST = 75;
    if (mgcBalance < SPIN_COST) {
      toast.error(`رصيد MGC غير كافٍ! تحتاج ${SPIN_COST} MGC`);
      return { success: false, error: 'رصيد MGC غير كافٍ' };
    }
    let pityCounter = userData?.pityCounter || 0;
    let reward = getRandomReward(MACHINE_REWARDS);
    let isPity = false;
    if (reward.isFail) {
      pityCounter++;
    } else {
      pityCounter = 0;
    }
    if (pityCounter >= 2) {
      reward = getRandomReward(PITY_REWARDS);
      pityCounter = 0;
      isPity = true;
    }
    const deductSuccess = await get().deductMgcBalance(SPIN_COST);
    if (!deductSuccess) {
      return { success: false, error: 'فشل الخصم' };
    }
    let prizeMessage = '';
    let prizeValue = 0;
    let xpGained = 0;
    if (reward.isCoupon) {
      const coupon = {
        code: `DISCOUNT${Date.now()}`,
        value: reward.couponValue,
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      };
      await updateDoc(doc(db, 'users', user.uid), {
        coupons: [...(userData?.coupons || []), coupon],
      });
      prizeMessage = `🎫 كوبون خصم ${reward.couponValue}%!`;
    } else if (reward.isFreeCoupon) {
      const coupon = {
        code: `FREE${Date.now()}`,
        amount: reward.couponAmount,
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      };
      await updateDoc(doc(db, 'users', user.uid), {
        freeCoupons: [...(userData?.freeCoupons || []), coupon],
      });
      prizeMessage = `🎁 كوبون شراء مجاني بقيمة ${reward.couponAmount}$!`;
    } else if (reward.isXP) {
      xpGained = reward.xpValue;
      const newXP = (userData?.xp || 0) + xpGained;
      const newLevel = calculateLevel(newXP);
      const newTitle = getTitleByLevel(newLevel);
      await updateDoc(doc(db, 'users', user.uid), {
        xp: newXP,
        level: newLevel,
        title: newTitle,
      });
      prizeMessage = `⭐ +${xpGained} XP! المستوى ${newLevel} (${newTitle})`;
    } else if (reward.isTitle) {
      const specialTitles = ['الذهبي', 'الفضي', 'البرونزي', 'الماسي', 'الأسطوري'];
      const newTitle = specialTitles[Math.floor(Math.random() * specialTitles.length)];
      await updateDoc(doc(db, 'users', user.uid), {
        title: newTitle,
      });
      prizeMessage = `🏅 لقب جديد: ${newTitle}!`;
    } else {
      prizeValue = reward.value;
      await get().addMgcBalance(user.uid, prizeValue);
      prizeMessage = `🎉 ربحت ${prizeValue} MGC!`;
    }
    await updateDoc(doc(db, 'users', user.uid), {
      pityCounter: pityCounter,
    });
    try {
      const { collection, addDoc } = await import('firebase/firestore');
      await addDoc(collection(db, 'machineHistory'), {
        userId: user.uid,
        reward: reward.label,
        prize: prizeValue,
        xp: xpGained,
        cost: SPIN_COST,
        isPity,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.warn('فشل تسجيل تاريخ الماكينة:', error);
    }
    return {
      success: true,
      reward: reward.label,
      prizeMessage,
      prizeValue,
      isPity,
      pityCounter: pityCounter,
    };
  },

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