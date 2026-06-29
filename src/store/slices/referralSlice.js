// src/store/slices/referralSlice.js
import { doc, updateDoc, increment, addDoc, collection, serverTimestamp, query, where, getDocs, writeBatch , orderBy, limit, getDoc} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions'; // ✅ إضافة استيراد
import { db } from '../../firebase';
import toast from 'react-hot-toast';

export const createReferralSlice = (set, get) => ({
  // ===== الإحالات =====
  getReferralLink: () => {
    const { userData } = get();
    if (!userData?.uniqueId) return null;
    const baseUrl = window.location.origin;
    return `${baseUrl}/signup?ref=${userData.uniqueId}`;
  },

  getReferralCount: async () => {
    const { user } = get();
    if (!user) return 0;
    try {
      const q = query(
        collection(db, 'referral_rewards'),
        where('referrerId', '==', user.uid),
        where('status', '==', 'claimed')
      );
      const snap = await getDocs(q);
      return snap.size;
    } catch (error) {
      console.error('خطأ في جلب عدد الإحالات:', error);
      return 0;
    }
  },

  getRecentReferrals: async (limitCount = 10) => {
    const { user } = get();
    if (!user) return [];
    try {
      const q = query(
        collection(db, 'referral_rewards'),
        where('referrerId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const snap = await getDocs(q);
      const referrals = [];
      for (const docSnap of snap.docs) {
        const data = docSnap.data();
        const referredId = data.referredId;
        const userSnap = await getDoc(doc(db, 'users', referredId));
        if (!userSnap.exists()) continue;
        const userData = userSnap.data();
        const depositQuery = query(
          collection(db, 'topUpRequests'),
          where('userId', '==', referredId),
          where('status', '==', 'approved')
        );
        const depositSnap = await getDocs(depositQuery);
        const hasDeposited = !depositSnap.empty;
        const rewardStatus = data.status || 'pending';
        referrals.push({
          id: docSnap.id,
          referredId: referredId,
          name: userData.name || 'مستخدم',
          avatar: userData.avatar || null,
          uniqueId: userData.uniqueId || null,
          hasDeposited: hasDeposited,
          rewardAmount: data.rewardAmount || 20,
          rewardStatus: rewardStatus,
          createdAt: data.createdAt,
        });
      }
      return referrals;
    } catch (error) {
      console.error('خطأ في جلب الإحالات:', error);
      return [];
    }
  },

  // ===== صرف مكافآت الإحالة (عبر Cloud Function) =====
  claimReferralRewards: async () => {
    const { user } = get();
    if (!user) {
      toast.error('يجب تسجيل الدخول');
      return false;
    }

    try {
      const functions = getFunctions();
      const claimFn = httpsCallable(functions, 'claimReferralRewards');
      const result = await claimFn();

      if (result.data.success) {
        const claimedAmount = result.data.claimedAmount;
        const currentBalance = get().balance || 0;
        
        // تحديث الحالة المحلية مباشرة (لتحسين تجربة المستخدم)
        set({
          balance: currentBalance + claimedAmount,
          referralBalance: 0,
          userData: {
            ...get().userData,
            balance: currentBalance + claimedAmount,
            referralBalance: 0,
            totalReferralEarnings: (get().userData?.totalReferralEarnings || 0) + claimedAmount,
          },
        });
        
        toast.success(`✅ تم تحويل ${claimedAmount} MGC إلى رصيدك الرئيسي!`);
        return true;
      } else {
        toast.error(result.data.message || 'فشل صرف المكافآت');
        return false;
      }
    } catch (error) {
      console.error('فشل صرف المكافآت:', error);
      toast.error(error.message || 'حدث خطأ أثناء صرف المكافآت');
      return false;
    }
  },

  copyUniqueId: (uniqueId) => {
    navigator.clipboard.writeText(uniqueId);
    toast.success('تم نسخ المعرف: ' + uniqueId);
  },

 // ===== نظام دعم الشعبية (عبر Cloud Function) =====
supportUser: async (targetUserId) => {
  const { user } = get();
  if (!user) {
    toast.error('يجب تسجيل الدخول أولاً');
    return { success: false, error: 'يجب تسجيل الدخول' };
  }

  try {
    const functions = getFunctions();
    const supportFn = httpsCallable(functions, 'supportUser');
    const result = await supportFn({ targetUserId });

    if (result.data.success) {
      // تحديث الحالة المحلية (اختياري، لأن onSnapshot سيقوم بالتحديث)
      toast.success(`🌹 تم دعم المستخدم! -20 MGC (+1 شعبية)`);
      return { success: true };
    } else {
      toast.error(result.data.message || 'فشل الدعم');
      return { success: false, error: result.data.message };
    }
  } catch (error) {
    console.error('فشل الدعم:', error);
    toast.error(error.message || 'حدث خطأ أثناء الدعم');
    return { success: false, error: error.message };
  }
},

  getTotalSupportCount: async (targetUserId) => {
    try {
      const q = query(
        collection(db, 'support_activities'),
        where('toUserId', '==', targetUserId),
        where('type', '==', 'popularity')
      );
      const snap = await getDocs(q);
      return snap.size;
    } catch (error) {
      console.error('خطأ في جلب عدد الدعم:', error);
      return 0;
    }
  },

  getRecentSupporters: async (targetUserId, limit = 10) => {
    try {
      const q = query(
        collection(db, 'support_activities'),
        where('toUserId', '==', targetUserId),
        where('type', '==', 'popularity'),
        orderBy('createdAt', 'desc'),
        limit(limit)
      );
      const snap = await getDocs(q);
      const supporters = [];
      for (const doc of snap.docs) {
        const data = doc.data();
        const userSnap = await getDoc(doc(db, 'users', data.fromUserId));
        if (userSnap.exists()) {
          supporters.push({
            id: data.fromUserId,
            name: userSnap.data().name || 'مستخدم',
            avatar: userSnap.data().avatar || null,
            supportedAt: data.createdAt,
          });
        }
      }
      return supporters;
    } catch (error) {
      console.error('خطأ في جلب الداعمين:', error);
      return [];
    }
  },
});