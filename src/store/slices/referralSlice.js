// src/store/slices/referralSlice.js
import { doc, updateDoc, increment, addDoc, collection, serverTimestamp, query, where, getDocs, writeBatch , orderBy, limit, getDoc} from 'firebase/firestore';
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

  claimReferralRewards: async () => {
    const { user, userData, referralBalance } = get();
    if (!user) {
      toast.error('يجب تسجيل الدخول');
      return false;
    }
    if (referralBalance < 100) {
      toast.error(`رصيد الإحالات غير كافٍ! تحتاج 100 MGC، لديك ${referralBalance} MGC`);
      return false;
    }
    try {
      const userRef = doc(db, 'users', user.uid);
      const batch = writeBatch(db);
      batch.update(userRef, {
        balance: increment(referralBalance),
        referralBalance: 0,
        totalReferralEarnings: increment(referralBalance),
      });
      const q = query(
        collection(db, 'referral_rewards'),
        where('referrerId', '==', user.uid),
        where('status', '==', 'pending')
      );
      const snap = await getDocs(q);
      snap.docs.forEach(docSnap => {
        batch.update(docSnap.ref, {
          status: 'claimed',
          claimedAt: serverTimestamp(),
        });
      });
      await batch.commit();
      const newBalance = (get().balance || 0) + referralBalance;
      set({
        balance: newBalance,
        userData: { ...userData, referralBalance: 0, totalReferralEarnings: (userData.totalReferralEarnings || 0) + referralBalance },
        referralBalance: 0,
      });
      toast.success(`✅ تم تحويل ${referralBalance} MGC إلى رصيدك الرئيسي!`);
      return true;
    } catch (error) {
      console.error('فشل صرف المكافآت:', error);
      toast.error('حدث خطأ أثناء صرف المكافآت');
      return false;
    }
  },

  copyUniqueId: (uniqueId) => {
    navigator.clipboard.writeText(uniqueId);
    toast.success('تم نسخ المعرف: ' + uniqueId);
  },

  // ===== نظام دعم الشعبية =====
  supportUser: async (targetUserId) => {
    const { user, mgcBalance } = get();
    const SUPPORT_COST = 20;
    if (!user) {
      toast.error('يجب تسجيل الدخول أولاً');
      return { success: false, error: 'يجب تسجيل الدخول' };
    }
    if (user.uid === targetUserId) {
      toast.error('لا يمكنك دعم نفسك');
      return { success: false, error: 'لا يمكنك دعم نفسك' };
    }
    if (mgcBalance < SUPPORT_COST) {
      toast.error(`رصيد MGC غير كافٍ! تحتاج ${SUPPORT_COST} MGC، رصيدك: ${mgcBalance.toFixed(0)} MGC`);
      return { success: false, error: 'رصيد MGC غير كافٍ' };
    }
    try {
      const deducted = await get().deductMgcBalance(SUPPORT_COST);
      if (!deducted) {
        return { success: false, error: 'فشل خصم MGC' };
      }
      await addDoc(collection(db, 'support_activities'), {
        fromUserId: user.uid,
        toUserId: targetUserId,
        type: 'popularity',
        value: 1,
        cost: SUPPORT_COST,
        createdAt: serverTimestamp(),
      });
      const targetRef = doc(db, 'users', targetUserId);
      await updateDoc(targetRef, {
        popularity: increment(1),
        xp: increment(5),
      });
      if (get().userData?.uid === targetUserId) {
        const currentUserData = get().userData;
        set({
          userData: {
            ...currentUserData,
            popularity: (currentUserData.popularity || 0) + 1,
            xp: (currentUserData.xp || 0) + 5,
          }
        });
      }
      toast.success(`🌹 تم دعم المستخدم! -${SUPPORT_COST} MGC (+1 شعبية)`);
      return { success: true, newBalance: get().mgcBalance };
    } catch (error) {
      console.error('فشل الدعم:', error);
      toast.error('حدث خطأ أثناء الدعم');
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