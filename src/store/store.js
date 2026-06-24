import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  doc, updateDoc, increment, onSnapshot, setDoc, 
  getDoc, addDoc, collection, serverTimestamp,
  query, where, orderBy, getDocs, writeBatch, onSnapshot as onSnapshotFirestore ,
  runTransaction ,limit,arrayUnion, arrayRemove
} from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';

// ===== قطاعات الدولاب مع الأوزان =====
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

// ===== ماكينة الحظ (الجوائز) =====
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

// ===== جوائز التعويض (بعد سحبين فاشلين) =====
const PITY_REWARDS = [
  { label: 'خصم 10%', isCoupon: true, couponValue: 10, weight: 25 },
  { label: '+100 XP', isXP: true, xpValue: 100, weight: 25 },
  { label: 'كوبون 1$', isFreeCoupon: true, couponAmount: 1, weight: 20 },
  { label: 'كوبون 2$', isFreeCoupon: true, couponAmount: 2, weight: 15 },
  { label: 'كوبون 5$', isFreeCoupon: true, couponAmount: 5, weight: 10 },
  { label: 'لقب نادر', isTitle: true, weight: 5 },
];

// ===== ألقاب المستويات =====
const LEVEL_TITLES = {
  1: 'مبتدئ',
  2: 'مستكشف',
  3: 'مغامر',
  4: 'الشاطر',
  5: 'بطل',
  6: 'أسطورة',
  7: 'محارب',
  8: 'الحاج',
  9: 'سيد',
  10: 'ملكي',
};

// ===== دوال مساعدة =====
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

// =====================================================
// ===== الـ Store الرئيسي =====
export const useAppStore = create(
  persist(
    (set, get) => ({
      // ========== المستخدم والجلسة ==========
      user: null,
      userData: null,
      setUser: (user) => set({ user }),

      // ========== الرصيد الحقيقي (المودع) ==========
      balance: 0,                         // ✅ الرصيد الحقيقي بالدولار
      setBalance: (balance) => set({ balance }),

      // ========== رصيد عملات MGC ==========
      mgcBalance: 0,
      setMgcBalance: (mgcBalance) => set({ mgcBalance }),

      // ========== رصيد الإحالات (محجوز) ==========
referralBalance: 0,  // ✅ أضف هذا السطر
      // ===== تحديث بيانات المستخدم (يستخدم في AuthContext) =====

      setUserData: (data) => set({
  userData: data,
  user: data?.user || data,
  balance: data?.balance || 0,
  mgcBalance: data?.mgcBalance || 0,
  referralBalance: data?.referralBalance || 0,  // ✅ أضف هذا
}),

      setUserFull: (userData) => set({
        user: userData,
        userData: userData,
        balance: userData?.balance || 0,
        mgcBalance: userData?.mgcBalance || 0,
        referralBalance: userData?.referralBalance || 0,
      }),

      // ===== الاستماع لتحديثات الرصيد =====
      listenToBalance: (userId) => {
        if (!userId) return () => {};
        const userRef = doc(db, 'users', userId);
        const unsubscribe = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            get().setBalance(data.balance || 0);        // الرصيد الحقيقي
            get().setMgcBalance(data.mgcBalance || 0);  // رصيد MGC
          }
        }, (error) => {
          console.error('خطأ في الاستماع للرصيد:', error);
        });
        return unsubscribe;
      },

      // ===== دوال إدارة الرصيد الحقيقي (balance) =====
      addBalance: async (userId, amountUSD) => {
        if (amountUSD <= 0) return false;
        try {
          const userRef = doc(db, 'users', userId);
          await updateDoc(userRef, { balance: increment(amountUSD) });
          const { balance, setBalance } = get();
          setBalance(balance + amountUSD);
          toast.success(`تم إضافة ${amountUSD.toFixed(2)} $ إلى رصيدك الحقيقي`);
          return true;
        } catch (error) {
          console.error('فشل إضافة الرصيد الحقيقي:', error);
          toast.error('حدث خطأ أثناء إضافة الرصيد');
          return false;
        }
      },

      deductBalance: async (amountUSD) => {
        const { user, balance, setBalance } = get();
        if (balance < amountUSD) {
          toast.error(`رصيد حقيقي غير كافٍ! تحتاج ${amountUSD.toFixed(2)} $`);
          return false;
        }
        try {
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, { balance: increment(-amountUSD) });
          setBalance(balance - amountUSD);
          toast.success(`تم خصم ${amountUSD.toFixed(2)} $ من رصيدك الحقيقي`);
          return true;
        } catch (error) {
          console.error('فشل خصم الرصيد الحقيقي:', error);
          toast.error('حدث خطأ أثناء خصم الرصيد');
          return false;
        }
      },

      // ===== دوال إدارة رصيد MGC =====
      addMgcBalance: async (userId, amountMGC) => {
        if (amountMGC <= 0) return false;
        try {
          const userRef = doc(db, 'users', userId);
          await updateDoc(userRef, { mgcBalance: increment(amountMGC) });
          const { mgcBalance, setMgcBalance } = get();
          if (get().user && get().user.uid === userId) {
            setMgcBalance(mgcBalance + amountMGC);
          }
          toast.success(`تم إضافة ${amountMGC.toFixed(2)} MGC إلى رصيدك`);
          return true;
        } catch (error) {
          console.error('فشل إضافة رصيد MGC:', error);
          toast.error('حدث خطأ أثناء إضافة رصيد MGC');
          return false;
        }
      },

      deductMgcBalance: async (amountMGC) => {
        const { user, mgcBalance, setMgcBalance } = get();
        if (mgcBalance < amountMGC) {
          toast.error(`رصيد MGC غير كافٍ! تحتاج ${amountMGC} MGC`);
          return false;
        }
        try {
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, { mgcBalance: increment(-amountMGC) });
          setMgcBalance(mgcBalance - amountMGC);
          toast.success(`تم خصم ${amountMGC.toFixed(2)} MGC من رصيدك`);
          return true;
        } catch (error) {
          console.error('فشل خصم رصيد MGC:', error);
          toast.error('حدث خطأ أثناء خصم رصيد MGC');
          return false;
        }
      },

      getBalance: () => {
        const { balance } = get();
        return balance;
      },

      getMgcBalance: () => {
        const { mgcBalance } = get();
        return mgcBalance;
      },

      // ===== دالة الدولاب (تستخدم MGC) =====
      spinWheel: async () => {
        const { user, mgcBalance, deductMgcBalance, addMgcBalance } = get();
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

        const deductSuccess = await deductMgcBalance(SPIN_COST);
        if (!deductSuccess) {
          return { success: false, prize: null, index: -1, message: 'فشل الخصم' };
        }

        if (prize > 0) {
          const addSuccess = await addMgcBalance(user.uid, prize);
          if (!addSuccess) {
            toast.error('فشل إضافة الجائزة، يرجى التواصل مع الدعم');
            return { success: false, prize: null, index: -1, message: 'فشل إضافة الجائزة' };
          }
        }

        try {
          const { collection, addDoc } = await import('firebase/firestore');
          const { db } = await import('../firebase');
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
          const { db } = await import('../firebase');
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

      // ===== دوال الغرف (الدردشات الخاصة والعشائر) =====
      createPrivateRoom: async (otherUserId, otherUserName) => {
        const { user, userData } = get();
        if (!user) return { success: false, error: 'يجب تسجيل الدخول' };
        
        const roomId = [user.uid, otherUserId].sort().join('_');
        const roomRef = doc(db, 'rooms', roomId);
        const roomSnap = await getDoc(roomRef);
        
        if (roomSnap.exists()) {
          return { success: true, roomId };
        }
        
        await setDoc(roomRef, {
          type: 'private',
          members: [user.uid, otherUserId],
          name: `${userData?.name || 'مستخدم'} و ${otherUserName}`,
          // name: `${otherUserName}`,
          imageUrl: userData?.avatar || null,
          lastMessage: '',
          lastMessageTime: null,
          createdAt: serverTimestamp(),
        });
        
        return { success: true, roomId };
      },

      createClanRoom: async (clanName, clanImage, members) => {
        const { user } = get();
        if (!user) return { success: false, error: 'يجب تسجيل الدخول' };
        
        const roomRef = collection(db, 'rooms');
        const newRoom = await addDoc(roomRef, {
          type: 'clan',
          members: [...members, user.uid],
          name: clanName,
          imageUrl: clanImage || null,
          lastMessage: '',
          lastMessageTime: null,
          createdAt: serverTimestamp(),
          createdBy: user.uid,
        });
        
        return { success: true, roomId: newRoom.id };
      },

      // ===== جلب الغرف =====
      fetchRooms: async () => {
        const { user } = get();
        if (!user) return [];
        try {
          const q = query(
            collection(db, 'rooms'),
            where('members', 'array-contains', user.uid),
            orderBy('lastMessageTime', 'desc')
          );
          const snapshot = await getDocs(q);
          return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
          console.error('خطأ في جلب الغرف:', error);
          return [];
        }
      },

      // ===== جلب رسائل غرفة معينة =====
      fetchRoomMessages: (roomId, callback) => {
        const q = query(
          collection(db, 'rooms', roomId, 'messages'),
          orderBy('timestamp', 'asc')
        );
        return onSnapshotFirestore(q, (snapshot) => {
          const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          callback(messages);
        }, (error) => {
          console.error('خطأ في جلب الرسائل:', error);
        });
      },

      // ===== إرسال رسالة في غرفة =====
      sendRoomMessage: async (roomId, text) => {
        const { user, userData } = get();
        if (!user) return { success: false, error: 'يجب تسجيل الدخول' };
        if (!text.trim()) return { success: false, error: 'الرسالة فارغة' };

        try {
          await addDoc(collection(db, 'rooms', roomId, 'messages'), {
            uid: user.uid,
            displayName: userData?.name || user?.displayName || 'مستخدم',
            photoURL: userData?.avatar || user?.photoURL || null,
            text: text.trim(),
            timestamp: serverTimestamp(),
          });

          const roomRef = doc(db, 'rooms', roomId);
          await updateDoc(roomRef, {
            lastMessage: text.trim(),
            lastMessageTime: serverTimestamp(),
          });

          return { success: true };
        } catch (error) {
          console.error('فشل إرسال الرسالة:', error);
          return { success: false, error: error.message };
        }
      },

     
// ===== تعليم جميع الطلبات كمقروءة (عند فتح صفحة الطلبات) =====
markFriendRequestsAsSeen: async () => {
  const { user } = get();
  if (!user) return;
  try {
    const q = query(
      collection(db, 'friendRequests'),
      where('to', '==', user.uid),
      where('status', '==', 'pending'),
      where('seen', '==', false)
    );
    const snap = await getDocs(q);
    if (snap.empty) return;
    const batch = writeBatch(db);
    snap.docs.forEach(docSnap => {
      batch.update(docSnap.ref, { seen: true });
    });
    await batch.commit();
    // تحديث العداد محلياً
    set({ pendingRequestsCount: 0 });
    // تحديث friendRequests بتعيين seen = true لكل الطلبات (أو يمكننا إعادة جلبها)
    // لكننا سنقوم بتحديث friendRequests بتعديل القائمة الحالية
    const { friendRequests } = get();
    const updatedRequests = friendRequests.map(req => ({ ...req, seen: true }));
    set({ friendRequests: updatedRequests });
  } catch (error) {
    console.error('فشل تعليم الطلبات كمقروءة:', error);
  }
},
      // ===== إزالة صديق (مع تحديث القوائم) =====

      removeFriend: async (friendId) => {
  const { user, userData, friendsList } = get();
  if (!user) return false;
  const currentFriends = userData?.friends || [];
  if (!currentFriends.includes(friendId)) {
    toast.error('هذا المستخدم ليس صديقاً لك');
    return false;
  }
  try {
    // تحديث قائمة أصدقاء المستخدم الحالي
    const newFriends = currentFriends.filter(id => id !== friendId);
    await updateDoc(doc(db, 'users', user.uid), { friends: newFriends });
    // أيضاً نقوم بإزالة المستخدم الحالي من قائمة أصدقاء الطرف الآخر (لكننا لا نستطيع تحديثها مباشرة دون معرفة uid الطرف الآخر، لكن يمكننا جلبها وتحديثها)
    // الأفضل: تحديث قائمة أصدقاء الطرف الآخر (اختياري، لكنه مطلوب)
    const otherUserSnap = await getDoc(doc(db, 'users', friendId));
    if (otherUserSnap.exists()) {
      const otherFriends = otherUserSnap.data()?.friends || [];
      const newOtherFriends = otherFriends.filter(id => id !== user.uid);
      await updateDoc(doc(db, 'users', friendId), { friends: newOtherFriends });
    }
    // تحديث الحالة المحلية
    set({
      userData: { ...userData, friends: newFriends },
      friendsList: friendsList.filter(f => f.id !== friendId),
    });
    toast.success('تم إزالة الصديق');
    return true;
  } catch (error) {
    console.error('فشل إزالة الصديق:', error);
    toast.error('حدث خطأ أثناء إزالة الصديق');
    return false;
  }
},

      // ===== دوال الحظر =====
      blockUser: async (userId) => {
        const { user, userData } = get();
        if (!user) return false;
        const blocked = userData?.blockedUsers || [];
        if (blocked.includes(userId)) return true;
        const newBlocked = [...blocked, userId];
        await updateDoc(doc(db, 'users', user.uid), { blockedUsers: newBlocked });
        set({ userData: { ...userData, blockedUsers: newBlocked } });
        toast.success('تم حظر المستخدم');
        return true;
      },

      unblockUser: async (userId) => {
        const { user, userData } = get();
        if (!user) return false;
        const blocked = userData?.blockedUsers || [];
        const newBlocked = blocked.filter(id => id !== userId);
        await updateDoc(doc(db, 'users', user.uid), { blockedUsers: newBlocked });
        set({ userData: { ...userData, blockedUsers: newBlocked } });
        toast.success('تم إلغاء الحظر');
        return true;
      },


// ============================================================
// ===== نظام الكلانات (Clans) =====
// ============================================================

// ===== إنشاء كلان جديد =====
createClan: async (clanData) => {
  const { user } = get();
  if (!user) {
    toast.error('يجب تسجيل الدخول');
    return { success: false, error: 'يجب تسجيل الدخول' };
  }

  const { name, description, type, imageUrl } = clanData;
  if (!name || name.trim().length < 3) {
    toast.error('اسم الكلان يجب أن يكون 3 أحرف على الأقل');
    return { success: false, error: 'اسم غير صالح' };
  }

  try {
    // ✅ التحقق الجديد: هل المستخدم عضو في أي كلان آخر؟
    const myClansQuery = query(collection(db, 'clans'), where('members', 'array-contains', user.uid));
    const myClansSnap = await getDocs(myClansQuery);
    if (!myClansSnap.empty) {
      const existingClanDoc = myClansSnap.docs[0];
      const existingClanData = existingClanDoc.data();
      toast.error(`لا يمكنك إنشاء كلان جديد لأنك عضو بالفعل في كلان "${existingClanData.name}". يرجى مغادرة الكلان الحالي أولاً.`);
      return { success: false, error: 'عضو في كلان آخر' };
    }

    // إنشاء الكلان الجديد
    const clanRef = await addDoc(collection(db, 'clans'), {
      name: name.trim(),
      description: description?.trim() || '',
      type: type || 'public',
      imageUrl: imageUrl || null,
      ownerId: user.uid,
      members: [user.uid],
      memberRoles: { [user.uid]: 'owner' }, // ✅ إضافة الأدوار
      moderators: [user.uid],
      points: 0,
      memberCount: 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // إنشاء غرفة دردشة للكلان
    const roomId = `clan_${clanRef.id}`;
    await setDoc(doc(db, 'rooms', roomId), {
      type: 'clan',
      clanId: clanRef.id,
      members: [user.uid],
      name: `دردشة ${name.trim()}`,
      imageUrl: imageUrl || null,
      lastMessage: '',
      lastMessageTime: null,
      createdAt: serverTimestamp(),
    });

    toast.success(`✅ تم إنشاء كلان "${name.trim()}" بنجاح!`);
    return { success: true, clanId: clanRef.id };
  } catch (error) {
    console.error('فشل إنشاء الكلان:', error);
    toast.error('حدث خطأ أثناء إنشاء الكلان');
    return { success: false, error: error.message };
  }
},

// ===== جلب الكلانات التي أنا عضو فيها =====
fetchMyClans: async () => {
  const { user } = get();
  if (!user) return [];

  try {
    const q = query(
      collection(db, 'clans'),
      where('members', 'array-contains', user.uid),
      orderBy('memberCount', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('خطأ في جلب الكلانات:', error);
    return [];
  }
},

// ===== جلب جميع الكلانات العامة (للاستكشاف) =====
fetchPublicClans: async () => {
  try {
    const q = query(
      collection(db, 'clans'),
      where('type', '==', 'public'),
      orderBy('memberCount', 'desc'),
      limit(50)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('خطأ في جلب الكلانات العامة:', error);
    return [];
  }
},

// ===== جلب بيانات كلان معين =====
fetchClan: async (clanId) => {
  try {
    const docSnap = await getDoc(doc(db, 'clans', clanId));
    if (!docSnap.exists()) {
      toast.error('الكلان غير موجود');
      return null;
    }
    return { id: docSnap.id, ...docSnap.data() };
  } catch (error) {
    console.error('خطأ في جلب الكلان:', error);
    return null;
  }
},

// ===== الانضمام إلى كلان عام =====
joinClan: async (clanId) => {
  const { user } = get();
  if (!user) {
    toast.error('يجب تسجيل الدخول');
    return false;
  }

  try {
    // 1. التحقق من وجود الكلان المستهدف
    const clanRef = doc(db, 'clans', clanId);
    const clanSnap = await getDoc(clanRef);
    if (!clanSnap.exists()) {
      toast.error('الكلان غير موجود');
      return false;
    }

    const clanData = clanSnap.data();

    // 2. التحقق: هل المستخدم عضو في هذا الكلان بالفعل؟
    if (clanData.members.includes(user.uid)) {
      toast.error('أنت بالفعل عضو في هذا الكلان');
      return false;
    }

    // 3. التحقق الجديد: هل المستخدم عضو في أي كلان آخر؟
    const myClansQuery = query(collection(db, 'clans'), where('members', 'array-contains', user.uid));
    const myClansSnap = await getDocs(myClansQuery);
    if (!myClansSnap.empty) {
      // يوجد كلان واحد على الأقل (نفترض أنه لا يمكن أن يكون في أكثر من واحد)
      const existingClanDoc = myClansSnap.docs[0];
      const existingClanData = existingClanDoc.data();
      // إذا كان الكلان الموجود ليس هو الكلان الذي يحاول الانضمام إليه
      if (existingClanDoc.id !== clanId) {
        toast.error(`أنت بالفعل عضو في كلان "${existingClanData.name}". يرجى مغادرة الكلان الحالي أولاً.`);
        return false;
      }
    }

    // 4. التأكد من أن الكلان عام (إذا كان خاصاً، يمنع الانضمام المباشر)
    if (clanData.type === 'private') {
      toast.error('هذا الكلان خاص، يرجى انتظار دعوة');
      return false;
    }

    // 5. إضافة المستخدم إلى الكلان
    await updateDoc(clanRef, {
      members: arrayUnion(user.uid),
      [`memberRoles.${user.uid}`]: 'member', // ✅ تعيين دور عضو
      memberCount: increment(1),
      updatedAt: serverTimestamp(),
    });

    // 6. إضافة المستخدم إلى غرفة الدردشة الخاصة بالكلان
    const roomId = `clan_${clanId}`;
    await updateDoc(doc(db, 'rooms', roomId), {
      members: arrayUnion(user.uid),
    });

    toast.success(`✅ تم الانضمام إلى "${clanData.name}" بنجاح!`);
    return true;
  } catch (error) {
    console.error('فشل الانضمام:', error);
    toast.error('حدث خطأ أثناء الانضمام');
    return false;
  }
},

// store.js
assignClanRole: async (clanId, targetUid, newRole) => {
  const { user } = get();
  if (!user) return { success: false, error: 'يجب تسجيل الدخول' };

  try {
    const clanRef = doc(db, 'clans', clanId);
    const clanSnap = await getDoc(clanRef);
    if (!clanSnap.exists()) return { success: false, error: 'الكلان غير موجود' };

    const clanData = clanSnap.data();
    if (clanData.ownerId !== user.uid) {
      return { success: false, error: 'المالك فقط يمكنه تغيير المناصب' };
    }

    await updateDoc(clanRef, {
      [`memberRoles.${targetUid}`]: newRole,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: error.message };
  }
},

// ===== مغادرة الكلان =====
leaveClan: async (clanId) => {
  const { user } = get();
  if (!user) {
    toast.error('يجب تسجيل الدخول');
    return false;
  }

  try {
    const clanRef = doc(db, 'clans', clanId);
    const clanSnap = await getDoc(clanRef);
    if (!clanSnap.exists()) {
      toast.error('الكلان غير موجود');
      return false;
    }

    const clanData = clanSnap.data();
    if (!clanData.members.includes(user.uid)) {
      toast.error('أنت لست عضواً في هذا الكلان');
      return false;
    }

    // التحقق: إذا كان المالك يغادر، يجب نقل الملكية أو حذف الكلان
    if (clanData.ownerId === user.uid) {
      const otherMembers = clanData.members.filter(id => id !== user.uid);
      if (otherMembers.length === 0) {
        // حذف الكلان إذا لم يبقَ أعضاء
        await deleteDoc(clanRef);
        toast.success('تم حذف الكلان لعدم وجود أعضاء');
        return true;
      } else {
        // نقل الملكية إلى أول عضو
        const newOwner = otherMembers[0];
        await updateDoc(clanRef, {
          ownerId: newOwner,
          members: arrayRemove(user.uid),
          memberCount: increment(-1),
          updatedAt: serverTimestamp(),
        });
        toast.success(`✅ تم نقل ملكية الكلان إلى عضو آخر`);
        return true;
      }
    }

    // إزالة المستخدم من الكلان
    await updateDoc(clanRef, {
      members: arrayRemove(user.uid),
      memberCount: increment(-1),
      updatedAt: serverTimestamp(),
    });

    // إزالة من غرفة الدردشة
    const roomId = `clan_${clanId}`;
    await updateDoc(doc(db, 'rooms', roomId), {
      members: arrayRemove(user.uid),
    });

    toast.success('✅ تم مغادرة الكلان بنجاح');
    return true;
  } catch (error) {
    console.error('فشل المغادرة:', error);
    toast.error('حدث خطأ أثناء المغادرة');
    return false;
  }
},

// ===== إرسال دعوة للانضمام إلى كلان =====
inviteToClan: async (clanId, invitedUserId) => {
  const { user } = get();
  if (!user) {
    toast.error('يجب تسجيل الدخول');
    return false;
  }

  try {
    // التحقق من وجود الكلان
    const clanSnap = await getDoc(doc(db, 'clans', clanId));
    if (!clanSnap.exists()) {
      toast.error('الكلان غير موجود');
      return false;
    }

    // التحقق من أن المستخدم الحالي مشرف أو مالك
    const clanData = clanSnap.data();
    if (!clanData.moderators.includes(user.uid) && clanData.ownerId !== user.uid) {
      toast.error('ليس لديك صلاحية لدعوة أعضاء');
      return false;
    }

    // التحقق من وجود دعوة سابقة
    const existingQuery = query(
      collection(db, 'clanInvites'),
      where('clanId', '==', clanId),
      where('invitedUserId', '==', invitedUserId),
      where('status', '==', 'pending')
    );
    const existingSnap = await getDocs(existingQuery);
    if (!existingSnap.empty) {
      toast.error('تم إرسال دعوة مسبقاً');
      return false;
    }

    await addDoc(collection(db, 'clanInvites'), {
      clanId,
      invitedUserId,
      invitedBy: user.uid,
      status: 'pending',
      createdAt: serverTimestamp(),
    });

    toast.success('✅ تم إرسال الدعوة بنجاح');
    return true;
  } catch (error) {
    console.error('فشل إرسال الدعوة:', error);
    toast.error('حدث خطأ أثناء إرسال الدعوة');
    return false;
  }
},

// ===== قبول دعوة الكلان =====
acceptClanInvite: async (inviteId) => {
  const { user } = get();
  if (!user) {
    toast.error('يجب تسجيل الدخول');
    return false;
  }

  try {
    const inviteRef = doc(db, 'clanInvites', inviteId);
    const inviteSnap = await getDoc(inviteRef);
    if (!inviteSnap.exists()) {
      toast.error('الدعوة غير موجودة');
      return false;
    }

    const inviteData = inviteSnap.data();
    if (inviteData.invitedUserId !== user.uid) {
      toast.error('هذه الدعوة ليست موجهة لك');
      return false;
    }

    if (inviteData.status !== 'pending') {
      toast.error('تمت معالجة هذه الدعوة مسبقاً');
      return false;
    }

    const clanId = inviteData.clanId;
    const clanRef = doc(db, 'clans', clanId);
    const clanSnap = await getDoc(clanRef);
    if (!clanSnap.exists()) {
      toast.error('الكلان غير موجود');
      return false;
    }

    // إضافة المستخدم إلى الكلان
    await updateDoc(clanRef, {
      members: arrayUnion(user.uid),
      memberCount: increment(1),
      updatedAt: serverTimestamp(),
    });

    // إضافة إلى غرفة الدردشة
    const roomId = `clan_${clanId}`;
    await updateDoc(doc(db, 'rooms', roomId), {
      members: arrayUnion(user.uid),
    });

    // تحديث حالة الدعوة
    await updateDoc(inviteRef, { status: 'accepted' });

    toast.success(`✅ تم الانضمام إلى الكلان بنجاح!`);
    return true;
  } catch (error) {
    console.error('فشل قبول الدعوة:', error);
    toast.error('حدث خطأ أثناء قبول الدعوة');
    return false;
  }
},

// ===== رفض دعوة الكلان =====
rejectClanInvite: async (inviteId) => {
  const { user } = get();
  if (!user) {
    toast.error('يجب تسجيل الدخول');
    return false;
  }

  try {
    const inviteRef = doc(db, 'clanInvites', inviteId);
    const inviteSnap = await getDoc(inviteRef);
    if (!inviteSnap.exists()) {
      toast.error('الدعوة غير موجودة');
      return false;
    }

    const inviteData = inviteSnap.data();
    if (inviteData.invitedUserId !== user.uid) {
      toast.error('هذه الدعوة ليست موجهة لك');
      return false;
    }

    await updateDoc(inviteRef, { status: 'rejected' });
    toast.success('تم رفض الدعوة');
    return true;
  } catch (error) {
    console.error('فشل رفض الدعوة:', error);
    toast.error('حدث خطأ أثناء رفض الدعوة');
    return false;
  }
},

// ===== جلب دعوات الكلان الواردة =====
fetchClanInvites: async () => {
  const { user } = get();
  if (!user) return [];

  try {
    const q = query(
      collection(db, 'clanInvites'),
      where('invitedUserId', '==', user.uid),
      where('status', '==', 'pending')
    );
    const snapshot = await getDocs(q);
    const invites = [];
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      // جلب اسم الكلان
      const clanSnap = await getDoc(doc(db, 'clans', data.clanId));
      invites.push({
        id: docSnap.id,
        ...data,
        clanName: clanSnap.exists() ? clanSnap.data().name : 'غير معروف',
      });
    }
    return invites;
  } catch (error) {
    console.error('خطأ في جلب دعوات الكلان:', error);
    return [];
  }
},
// ===== استماع حي لطلبات الصداقة (عداد الشارة) =====
listenToFriendRequests: () => {
  const { user } = get();
  if (!user) return () => {};
  const q = query(
    collection(db, 'friendRequests'),
    where('to', '==', user.uid),
    where('status', '==', 'pending'),
    where('seen', '==', false)
  );
  return onSnapshot(q, (snap) => {
    const requests = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    set({ friendRequests: requests, pendingRequestsCount: requests.length });
  }, (err) => console.error('خطأ استماع طلبات الصداقة:', err));
},
// ===== إرسال طلب صداقة (موجود عندك addFriend لكن راح ننشئ طلب صداقة) =====
// ===== إرسال طلب صداقة =====
sendFriendRequest: async (toUserId) => {
  const { user, userData } = get();
  if (!user) {
    toast.error('يجب تسجيل الدخول');
    return false;
  }
  if (user.uid === toUserId) {
    toast.error('لا يمكنك إرسال طلب لنفسك');
    return false;
  }
  // التحقق من أن المستخدم ليس صديقاً بالفعل
  const friends = userData?.friends || [];
  if (friends.includes(toUserId)) {
    toast.error('هذا المستخدم موجود بالفعل في قائمة أصدقائك');
    return false;
  }
  // التحقق من وجود طلب معلق
  const pendingQuery = query(
    collection(db, 'friendRequests'),
    where('from', '==', user.uid),
    where('to', '==', toUserId),
    where('status', '==', 'pending')
  );
  const pendingSnap = await getDocs(pendingQuery);
  if (!pendingSnap.empty) {
    toast('طلب صداقة قيد الانتظار مسبقاً');
    return false;
  }
  // التحقق من وجود طلب مقبول سابقاً (حالة نادرة)
  const acceptedQuery = query(
    collection(db, 'friendRequests'),
    where('from', '==', user.uid),
    where('to', '==', toUserId),
    where('status', '==', 'accepted')
  );
  const acceptedSnap = await getDocs(acceptedQuery);
  if (!acceptedSnap.empty) {
    toast('أنتم أصدقاء بالفعل');
    return false;
  }
  await addDoc(collection(db, 'friendRequests'), {
    from: user.uid,
    to: toUserId,
    status: 'pending',
    seen: false,
    createdAt: serverTimestamp(),
  });
  toast.success('تم إرسال طلب الصداقة');
  return true;
},

// ===== نظام أرقام الفيزا والرقم السري =====
// تخزين مؤقت للأرقام المستخدمة (يمكن نقلها إلى Firestore لاحقاً)
visaNumbers: [],
setVisaNumbers: (visaNumbers) => set({ visaNumbers }),

// دالة لتوليد رقم فيزا فريد (16 رقم) من uid المستخدم
generateVisaNumber: async (userId) => {
  // 1. استخراج 8 أرقام من userId باستخدام hash بسيط
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i);
    hash = hash & hash; // تحويل إلى 32-bit integer
  }
  // تحويل القيمة المطلقة إلى 8 أرقام (مع padding بالأصفار)
  const numericPart = Math.abs(hash).toString().slice(0, 8).padStart(8, '0');
  // تكرار الجزء الرقمي مرتين ليكون 16 رقم
  const fullVisa = numericPart + numericPart;

  // 2. التحقق من عدم تكرار الرقم (محلياً وفي Firestore)
  const { visaNumbers, user } = get();
  if (visaNumbers.includes(fullVisa)) {
    // إذا تكرر، نعدل الرقم بإضافة 1 إلى الجزء الأول (مع الحفاظ على 8 خانات)
    const incremented = (parseInt(numericPart) + 1).toString().padStart(8, '0');
    const newVisa = incremented + incremented;
    // نتحقق مجدداً (يمكن تكرار العملية حتى نجد رقماً فريداً)
    if (visaNumbers.includes(newVisa)) {
      // في حالة نادرة جداً، نستخدم timestamp كحل أخير
      const fallback = Date.now().toString().slice(-8).padStart(8, '0');
      return fallback + fallback;
    }
    // تحديث القائمة المحلية
    set({ visaNumbers: [...visaNumbers, newVisa] });
    return newVisa;
  }

  // تخزين الرقم الجديد
  set({ visaNumbers: [...visaNumbers, fullVisa] });
  return fullVisa;
},

// دالة لتوليد رقم سري عشوائي (4-6 أرقام)
generateVisaSecret: () => {
  const length = Math.floor(Math.random() * 3) + 4; // 4, 5, أو 6
  let secret = '';
  for (let i = 0; i < length; i++) {
    secret += Math.floor(Math.random() * 10);
  }
  return secret;
},
// ===== قبول طلب الصداقة =====
// ===== قبول طلب الصداقة =====
// ===== قبول طلب الصداقة =====
acceptFriendRequest: async (requestId) => {
  const { user, userData } = get();
  if (!user) {
    toast.error('يجب تسجيل الدخول');
    return false;
  }
  try {
    const requestRef = doc(db, 'friendRequests', requestId);
    const requestSnap = await getDoc(requestRef);
    if (!requestSnap.exists()) {
      toast.error('الطلب غير موجود');
      return false;
    }
    const requestData = requestSnap.data();
    if (requestData.to !== user.uid) {
      toast.error('هذا الطلب ليس موجه لك');
      return false;
    }
    if (requestData.status !== 'pending') {
      toast.error('تمت معالجة هذا الطلب مسبقاً');
      return false;
    }
    const fromUserId = requestData.from;

    // تحديث الطلب إلى مقبول
    await updateDoc(requestRef, { status: 'accepted' });

    // جلب بيانات المستخدم الآخر
    const otherUserSnap = await getDoc(doc(db, 'users', fromUserId));
    const otherUserData = otherUserSnap.data();

    // التأكد من أن friends موجودة كمصفوفة
    const currentFriends = Array.isArray(userData?.friends) ? userData.friends : [];
    const otherFriends = Array.isArray(otherUserData?.friends) ? otherUserData.friends : [];

    // تحديث قائمة الأصدقاء لكلا الطرفين
    const batch = writeBatch(db);
    batch.update(doc(db, 'users', user.uid), {
      friends: [...currentFriends, fromUserId]
    });
    batch.update(doc(db, 'users', fromUserId), {
      friends: [...otherFriends, user.uid]
    });
    await batch.commit();

    // تحديث الحالة المحلية (userData و friendsList)
    const newFriendsList = [...(get().friendsList || []), { id: fromUserId, ...otherUserData }];
    const newUserData = {
      ...userData,
      friends: [...currentFriends, fromUserId]
    };

    set({
      userData: newUserData,                 // ✅ تحديث userData في الـ Store
      friendsList: newFriendsList,
      friendRequests: get().friendRequests.filter(r => r.id !== requestId),
      pendingRequestsCount: Math.max(0, get().pendingRequestsCount - 1),
    });

    toast.success('تم قبول الصداقة');
    return true;
  } catch (error) {
    console.error('فشل قبول الطلب:', error);
    toast.error('حدث خطأ أثناء قبول الطلب');
    return false;
  }
},

// ===== رفض طلب الصداقة =====
// ===== رفض طلب الصداقة =====
rejectFriendRequest: async (requestId) => {
  const { user } = get();
  if (!user) {
    toast.error('يجب تسجيل الدخول');
    return false;
  }
  try {
    const requestRef = doc(db, 'friendRequests', requestId);
    const requestSnap = await getDoc(requestRef);
    if (!requestSnap.exists()) {
      toast.error('الطلب غير موجود');
      return false;
    }
    const requestData = requestSnap.data();
    if (requestData.to !== user.uid) {
      toast.error('هذا الطلب ليس موجه لك');
      return false;
    }
    if (requestData.status !== 'pending') {
      toast.error('تمت معالجة هذا الطلب مسبقاً');
      return false;
    }
    await updateDoc(requestRef, { status: 'rejected' });
    // تحديث الحالة المحلية
    set((state) => ({
      friendRequests: state.friendRequests.filter(r => r.id !== requestId),
      pendingRequestsCount: Math.max(0, state.pendingRequestsCount - 1),
    }));
    toast.success('تم رفض الطلب');
    return true;
  } catch (error) {
    console.error('فشل رفض الطلب:', error);
    toast.error('حدث خطأ أثناء رفض الطلب');
    return false;
  }
},

// ===== جلب قائمة الإحالات مع حالة الإيداع =====
getRecentReferrals: async (limitCount = 10) => {
  const { user } = get();
  if (!user) return [];
  try {
    // جلب جميع سجلات الإحالة للمستخدم
    const q = query(
      collection(db, 'referral_rewards'),
      where('referrerId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    const referrals = [];

    // ✅ تغيير اسم المتغير من `doc` إلى `docSnap` لتجنب التعارض مع دالة `doc`
    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      const referredId = data.referredId;
      
      // جلب بيانات المستخدم المحال
      const userSnap = await getDoc(doc(db, 'users', referredId)); // ✅ doc هي الدالة المستوردة
      if (!userSnap.exists()) continue;
      const userData = userSnap.data();
      
      // التحقق مما إذا كان المستخدم قد قام بأول إيداع معتمد
      // ✅ إزالة orderBy لتجنب الحاجة إلى فهرس مركب
      const depositQuery = query(
        collection(db, 'topUpRequests'),
        where('userId', '==', referredId),
        where('status', '==', 'approved')
      );
      const depositSnap = await getDocs(depositQuery);
      const hasDeposited = !depositSnap.empty;
      
      // الحالة (pending أو claimed)
      const rewardStatus = data.status || 'pending';

      referrals.push({
        id: docSnap.id,                     // ✅ استخدام docSnap.id
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
// ===== جلب طلبات الصداقة الواردة (غير المقروءة) =====
fetchFriendRequests: async () => {
  const { user } = get();
  if (!user) return;
  try {
    const q = query(
      collection(db, 'friendRequests'),
      where('to', '==', user.uid),
      where('status', '==', 'pending'),
      where('seen', '==', false)
    );
    const snapshot = await getDocs(q);
    const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    set({ friendRequests: requests, pendingRequestsCount: requests.length });
  } catch (error) {
    console.error('خطأ جلب طلبات الصداقة:', error);
  }
},
// ===== جلب قائمة الأصدقاء (مع البيانات) =====
// ===== جلب قائمة الأصدقاء (مع البيانات) =====
fetchFriendsList: async () => {
  const { user } = get();
  if (!user) return;
  try {
    const userSnap = await getDoc(doc(db, 'users', user.uid));
    const friendsIds = userSnap.data()?.friends || [];
    if (friendsIds.length === 0) {
      set({ friendsList: [] });
      return;
    }
    const friendsData = [];
    for (const fid of friendsIds) {
      const fSnap = await getDoc(doc(db, 'users', fid));
      if (fSnap.exists()) {
        friendsData.push({ id: fid, ...fSnap.data() });
      }
    }
    set({ friendsList: friendsData });
  } catch (error) {
    console.error('خطأ جلب قائمة الأصدقاء:', error);
  }
},


// ===== نظام المعرف الفريد =====
// ===== نظام المعرف الفريد =====
// ===== نظام المعرف الفريد (تسلسلي تصاعدي) =====
generateUniqueId: async () => {
  const counterRef = doc(db, 'app_metadata', 'counters');
  try {
    // استخدام transaction لضمان الذرية ومنع التكرار
    const result = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      let newCount = 1;
      if (!counterDoc.exists()) {
        // أول مستخدم: نضع العداد = 1
        transaction.set(counterRef, { uniqueIdCounter: 1 });
      } else {
        const currentCount = counterDoc.data().uniqueIdCounter || 0;
        newCount = currentCount + 1;
        transaction.update(counterRef, { uniqueIdCounter: newCount });
      }
      return newCount;
    });
    // تنسيق الرقم إلى 8 خانات (مثل 00000001)
    const paddedNumber = String(result).padStart(8, '0');
    return `MGC_${paddedNumber}`;
  } catch (error) {
    console.error('فشل توليد المعرف الفريد:', error);
    // احتياطي: استخدام الطابع الزمني
    const fallbackId = `MGC_${Date.now().toString().slice(-8)}`;
    return fallbackId;
  }
},

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
    console.error('خطأ في البحث:', error);
    toast.error('حدث خطأ أثناء البحث');
    return null;
  }
},
// ===== البحث عن مستخدمين بادئة (للاقتراحات) =====
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
    console.error('خطأ في البحث بالبادئة:', error);
    return [];
  }
},

// ===== نظام دعم الشعبية (غير محدود) =====
supportUser: async (targetUserId) => {
  const { user, mgcBalance, deductMgcBalance, userData } = get();
  const SUPPORT_COST = 20; // 20 MGC لكل دعم

  if (!user) {
    toast.error('يجب تسجيل الدخول أولاً');
    return { success: false, error: 'يجب تسجيل الدخول' };
  }

  if (user.uid === targetUserId) {
    toast.error('لا يمكنك دعم نفسك');
    return { success: false, error: 'لا يمكنك دعم نفسك' };
  }

  // التحقق من رصيد MGC
  if (mgcBalance < SUPPORT_COST) {
    toast.error(`رصيد MGC غير كافٍ! تحتاج ${SUPPORT_COST} MGC، رصيدك: ${mgcBalance.toFixed(0)} MGC`);
    return { success: false, error: 'رصيد MGC غير كافٍ' };
  }

  try {
    // ✅ لا يوجد تحقق من الدعم المسبق - مسموح بالتكرار

    // خصم MGC من الداعم
    const deducted = await deductMgcBalance(SUPPORT_COST);
    if (!deducted) {
      return { success: false, error: 'فشل خصم MGC' };
    }

    // تسجيل عملية الدعم
    await addDoc(collection(db, 'support_activities'), {
      fromUserId: user.uid,
      toUserId: targetUserId,
      type: 'popularity',
      value: 1,
      cost: SUPPORT_COST,
      createdAt: serverTimestamp(),
    });

    // زيادة الشعبية للمستخدم المستهدف (+1)
    const targetRef = doc(db, 'users', targetUserId);
    await updateDoc(targetRef, {
      popularity: increment(1),
    });

    // إضافة XP بسيطة للمستخدم المستهدف (+5 XP لكل دعم)
    await updateDoc(targetRef, {
      xp: increment(5),
    });

    // تحديث الشعبية محلياً إذا كان المستهدف هو المستخدم الحالي
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

    // تحديث mgcBalance محلياً (بعد الخصم)
    // deductMgcBalance تقوم بهذا تلقائياً

    toast.success(`🌹 تم دعم المستخدم! -${SUPPORT_COST} MGC (+1 شعبية)`);
    return { success: true, newBalance: get().mgcBalance };

  } catch (error) {
    console.error('فشل الدعم:', error);
    toast.error('حدث خطأ أثناء الدعم');
    return { success: false, error: error.message };
  }
},

// التحقق من إجمالي الدعم المقدم لمستخدم معين (للعرض فقط)
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

// جلب آخر 10 داعمين لمستخدم معين (للشريط)
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


// ===== نظام الإحالة =====
// الحصول على رابط الإحالة
// ===== نظام الإحالة =====
getReferralLink: () => {
  const { userData } = get();
  if (!userData?.uniqueId) return null;
  const baseUrl = window.location.origin;
  return `${baseUrl}/signup?ref=${userData.uniqueId}`; // ✅ تغيير المسار إلى /signup
},

// جلب عدد الإحالات الناجحة (المكافآت التي تم صرفها)
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
// ===== بيع MGC =====
sellMgc: async (mgcAmount) => {
  const { user, mgcBalance, deductMgcBalance, addBalance } = get();
  if (!user) {
    toast.error('يجب تسجيل الدخول');
    return false;
  }
  if (mgcAmount <= 0) {
    toast.error('الكمية يجب أن تكون أكبر من صفر');
    return false;
  }
  if (mgcAmount > mgcBalance) {
    toast.error(`الرصيد المتاح هو ${mgcBalance} MGC فقط`);
    return false;
  }

  const RATE = 0.007; // 1 MGC = 0.007 USD (100 MGC = 0.70 USD)
  const usdAmount = mgcAmount * RATE;

  try {
    // خصم MGC
    const deducted = await deductMgcBalance(mgcAmount);
    if (!deducted) {
      toast.error('فشل خصم MGC');
      return false;
    }

    // إضافة رصيد حقيقي
    const added = await addBalance(user.uid, usdAmount);
    if (!added) {
      // استرجاع MGC في حال فشل الإضافة (يمكن تحسينه)
      toast.error('فشل إضافة الرصيد، تم استرجاع MGC');
      await addMgcBalance(user.uid, mgcAmount);
      return false;
    }

    // تسجيل عملية البيع
    await addDoc(collection(db, 'mgcSales'), {
      userId: user.uid,
      mgcAmount: mgcAmount,
      usdReceived: usdAmount,
      rate: RATE,
      timestamp: serverTimestamp(),
    });

    toast.success(`✅ تم بيع ${mgcAmount} MGC مقابل ${usdAmount.toFixed(2)} $`);
    return true;
  } catch (error) {
    console.error('فشل بيع MGC:', error);
    toast.error('حدث خطأ أثناء البيع');
    return false;
  }
},

// ===== جلب سجل بيع MGC =====
getMgcSalesHistory: async () => {
  const { user } = get();
  if (!user) return [];
  try {
    const q = query(
      collection(db, 'mgcSales'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(20)
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('خطأ في جلب سجل البيع:', error);
    return [];
  }
}, 

// ===== جلب اقتراحات الأصدقاء (مستخدمين حقيقيين) =====
fetchSuggestedFriends: async () => {
  const { user, userData } = get();
  if (!user) return [];

  try {
    // 1. جلب جميع المستخدمين
    const usersSnap = await getDocs(collection(db, 'users'));
    const allUsers = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // 2. تصفية المستخدمين:
    //    - ليس المستخدم الحالي
    //    - ليس في قائمة الأصدقاء
    //    - ليس في قائمة المحظورين
    //    - لم يتم إرسال طلب صداقة له (معلقة)
    const friends = userData?.friends || [];
    const blocked = userData?.blockedUsers || [];

    // جلب الطلبات المعلقة التي أرسلها المستخدم
    const sentRequestsSnap = await getDocs(query(
      collection(db, 'friendRequests'),
      where('from', '==', user.uid),
      where('status', '==', 'pending')
    ));
    const sentRequestIds = sentRequestsSnap.docs.map(doc => doc.data().to);

    // جلب الطلبات المعلقة التي وصلت للمستخدم
    const receivedRequestsSnap = await getDocs(query(
      collection(db, 'friendRequests'),
      where('to', '==', user.uid),
      where('status', '==', 'pending')
    ));
    const receivedRequestIds = receivedRequestsSnap.docs.map(doc => doc.data().from);

    // دمج جميع المعرفات المستثناة
    const excludeIds = new Set([
      user.uid,
      ...friends,
      ...blocked,
      ...sentRequestIds,
      ...receivedRequestIds,
    ]);

    // 3. ترشيح المستخدمين
    const suggested = allUsers
      .filter(u => !excludeIds.has(u.id))
      .slice(0, 10); // حد أقصى 10 اقتراحات

    return suggested;
  } catch (error) {
    console.error('خطأ في جلب اقتراحات الأصدقاء:', error);
    return [];
  }
},
// ===== دوال إحصاءات المهام =====
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

getDepositCount: async () => {
  const { user } = get();
  if (!user) return 0;
  try {
    const q = query(collection(db, 'topUpRequests'), where('userId', '==', user.uid), where('status', '==', 'approved'));
    const snap = await getDocs(q);
    return snap.size;
  } catch { return 0; }
},

getOrdersCount: async () => {
  const { user } = get();
  if (!user) return 0;
  try {
    const q = query(collection(db, 'orders'), where('userId', '==', user.uid), where('status', '==', 'completed'));
    const snap = await getDocs(q);
    return snap.size;
  } catch { return 0; }
},

getReferralCount: async () => {
  const { user } = get();
  if (!user) return 0;
  try {
    const q = query(collection(db, 'referral_rewards'), where('referrerId', '==', user.uid), where('status', '==', 'claimed'));
    const snap = await getDocs(q);
    return snap.size;
  } catch { return 0; }
},




// صرف مكافآت الإحالة (عندما يصل الرصيد إلى 100)
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

    // 1. نقل الرصيد من referralBalance إلى balance
    batch.update(userRef, {
      balance: increment(referralBalance),
      referralBalance: 0,
      totalReferralEarnings: increment(referralBalance),
    });

    // 2. تحديث حالة جميع سجلات الإحالة المعلقة إلى 'claimed'
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

    // تحديث الحالة المحلية
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
      // ===== ماكينة الحظ الجديدة (تستخدم MGC) =====
      pullMachine: async () => {
        const { user, mgcBalance, deductMgcBalance, addMgcBalance, userData } = get();
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

        const deductSuccess = await deductMgcBalance(SPIN_COST);
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
          await addMgcBalance(user.uid, prizeValue);
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

      // ========== باقي الدوال ==========
      currency: 'USD',
      toggleCurrency: () => set((state) => ({ currency: state.currency === 'USD' ? 'SYP' : 'USD' })),

      isDark: false,
      toggleTheme: () => set((state) => ({ isDark: !state.isDark })),

      exchangeRate: 145,
      setExchangeRate: (rate) => set({ exchangeRate: rate }),
      listenToExchangeRate: () => {
        const unsub = onSnapshot(doc(db, 'exchangeRate', 'default'), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.value) {
              get().setExchangeRate(data.value);
            }
          }
        }, (error) => {
          console.error('خطأ في الاستماع لسعر الصرف:', error);
        });
        return unsub;
      },

      listenToTopUpSettings: () => {
        const unsub = onSnapshot(doc(db, 'topUpSettings', 'default'), (docSnap) => {
          if (docSnap.exists()) {
            get().setTopUpSettings(docSnap.data());
          } else {
            get().setTopUpSettings(null);
          }
        }, (error) => {
          console.error('خطأ في الاستماع لإعدادات الإيداع:', error);
        });
        return unsub;
      },

      notifications: [],
      unreadCount: 0,
      setNotifications: (notifications) => set({ 
        notifications, 
        unreadCount: notifications.filter(n => !n.read).length 
      }),
      addNotification: (notification) => set((state) => ({ 
        notifications: [notification, ...state.notifications],
        unreadCount: state.unreadCount + 1
      })),
      markNotificationRead: (id) => set((state) => {
        const newNotifs = state.notifications.map(n => n.id === id ? { ...n, read: true } : n);
        return { notifications: newNotifs, unreadCount: newNotifs.filter(n => !n.read).length };
      }),
      markAllNotificationsRead: () => set((state) => {
        const newNotifs = state.notifications.map(n => ({ ...n, read: true }));
        return { notifications: newNotifs, unreadCount: 0 };
      }),

      games: [],
      setGames: (games) => set({ games }),
      loading: false,
      setLoading: (loading) => set({ loading }),

      fetchPackages: async () => {
        const { setLoading } = get();
        setLoading(true);
        try {
          const { collection, getDocs } = await import('firebase/firestore');
          const { db } = await import('../firebase');
          const snapshot = await getDocs(collection(db, 'packages'));
          const packages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
          console.error('Error fetching packages:', error);
        } finally {
          setLoading(false);
        }
      },

      addGame: async (gameData) => {
        const { games, setGames } = get();
        try {
          const { collection, addDoc } = await import('firebase/firestore');
          const { db } = await import('../firebase');
          const docRef = await addDoc(collection(db, 'games'), gameData);
          const newGame = { id: docRef.id, ...gameData };
          setGames([...games, newGame]);
          return true;
        } catch (error) {
          console.error('Error adding game:', error);
          return false;
        }
      },

      updateGame: async (id, gameData) => {
        const { games, setGames } = get();
        try {
          const { doc, updateDoc } = await import('firebase/firestore');
          const { db } = await import('../firebase');
          const gameRef = doc(db, 'games', id);
          await updateDoc(gameRef, gameData);
          const updatedGames = games.map(g => g.id === id ? { ...g, ...gameData } : g);
          setGames(updatedGames);
          return true;
        } catch (error) {
          console.error('Error updating game:', error);
          return false;
        }
      },

      deleteGame: async (id) => {
        const { games, setGames } = get();
        try {
          const { doc, deleteDoc, collection, getDocs } = await import('firebase/firestore');
          const { db } = await import('../firebase');
          
          const gameRef = doc(db, 'games', id);
          await deleteDoc(gameRef);
          
          try {
            const contentRef = doc(db, 'gameContent', id);
            await deleteDoc(contentRef);
          } catch (contentErr) {
            console.log('No gameContent found for this game, skipping.');
          }
          
          try {
            const packagesRef = collection(db, 'games', id, 'packages');
            const packagesSnap = await getDocs(packagesRef);
            const deletePromises = packagesSnap.docs.map(docSnap => 
              deleteDoc(doc(db, 'games', id, 'packages', docSnap.id))
            );
            await Promise.all(deletePromises);
          } catch (pkgErr) {
            console.log('No packages found or error deleting packages:', pkgErr);
          }
          
          const filteredGames = games.filter(g => g.id !== id);
          setGames(filteredGames);
          return true;
        } catch (error) {
          console.error('Error deleting game:', error);
          return false;
        }
      },

      fetchGamePackages: async (gameId) => {
        try {
          const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
          const { db } = await import('../firebase');
          const q = query(collection(db, 'games', gameId, 'packages'), orderBy('order', 'asc'));
          const snapshot = await getDocs(q);
          return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
          console.error('Error fetching game packages:', error);
          return [];
        }
      },

      addGamePackage: async (gameId, packageData) => {
        try {
          const { collection, addDoc } = await import('firebase/firestore');
          const { db } = await import('../firebase');
          const docRef = await addDoc(collection(db, 'games', gameId, 'packages'), {
            ...packageData,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          return docRef.id;
        } catch (error) {
          console.error('Error adding game package:', error);
          throw error;
        }
      },

      updateGamePackage: async (gameId, packageId, packageData) => {
        try {
          const { doc, updateDoc } = await import('firebase/firestore');
          const { db } = await import('../firebase');
          const packageRef = doc(db, 'games', gameId, 'packages', packageId);
          await updateDoc(packageRef, {
            ...packageData,
            updatedAt: new Date(),
          });
          return true;
        } catch (error) {
          console.error('Error updating game package:', error);
          throw error;
        }
      },

      deleteGamePackage: async (gameId, packageId) => {
        try {
          const { doc, deleteDoc } = await import('firebase/firestore');
          const { db } = await import('../firebase');
          const packageRef = doc(db, 'games', gameId, 'packages', packageId);
          await deleteDoc(packageRef);
          return true;
        } catch (error) {
          console.error('Error deleting game package:', error);
          throw error;
        }
      },

      fetchGameContent: async (gameId) => {
        try {
          const { doc, getDoc } = await import('firebase/firestore');
          const { db } = await import('../firebase');
          const docRef = doc(db, 'gameContent', gameId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) return docSnap.data();
          return null;
        } catch (error) {
          console.error('Error fetching game content:', error);
          return null;
        }
      },

      updateGameContent: async (gameId, contentData) => {
        try {
          const { doc, setDoc } = await import('firebase/firestore');
          const { db } = await import('../firebase');
          await setDoc(doc(db, 'gameContent', gameId), {
            ...contentData,
            updatedAt: new Date().toISOString(),
          }, { merge: true });
          return true;
        } catch (error) {
          console.error('Error updating game content:', error);
          return false;
        }
      },

      apps: [],
      setApps: (apps) => set({ apps }),

      addApp: async (appData) => {
        const { apps, setApps } = get();
        try {
          const { collection, addDoc } = await import('firebase/firestore');
          const { db } = await import('../firebase');
          const docRef = await addDoc(collection(db, 'apps'), appData);
          const newApp = { id: docRef.id, ...appData };
          setApps([...apps, newApp]);
          return true;
        } catch (error) {
          console.error('Error adding app:', error);
          return false;
        }
      },

      updateApp: async (id, appData) => {
        const { apps, setApps } = get();
        try {
          const { doc, updateDoc } = await import('firebase/firestore');
          const { db } = await import('../firebase');
          const appRef = doc(db, 'apps', id);
          await updateDoc(appRef, appData);
          const updatedApps = apps.map(a => a.id === id ? { ...a, ...appData } : a);
          setApps(updatedApps);
          return true;
        } catch (error) {
          console.error('Error updating app:', error);
          return false;
        }
      },

      deleteApp: async (id) => {
        const { apps, setApps } = get();
        try {
          const { doc, deleteDoc, collection, getDocs } = await import('firebase/firestore');
          const { db } = await import('../firebase');
          
          const appRef = doc(db, 'apps', id);
          await deleteDoc(appRef);
          
          try {
            const contentRef = doc(db, 'appContent', id);
            await deleteDoc(contentRef);
          } catch (contentErr) {
            console.log('No appContent found for this app, skipping.');
          }
          
          try {
            const packagesRef = collection(db, 'apps', id, 'packages');
            const packagesSnap = await getDocs(packagesRef);
            const deletePromises = packagesSnap.docs.map(docSnap => 
              deleteDoc(doc(db, 'apps', id, 'packages', docSnap.id))
            );
            await Promise.all(deletePromises);
          } catch (pkgErr) {
            console.log('No packages found or error deleting packages:', pkgErr);
          }
          
          const filteredApps = apps.filter(a => a.id !== id);
          setApps(filteredApps);
          return true;
        } catch (error) {
          console.error('Error deleting app:', error);
          return false;
        }
      },

      fetchAppPackages: async (appId) => {
        try {
          const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
          const { db } = await import('../firebase');
          const q = query(collection(db, 'apps', appId, 'packages'), orderBy('order', 'asc'));
          const snapshot = await getDocs(q);
          return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
          console.error('Error fetching app packages:', error);
          return [];
        }
      },

      addAppPackage: async (appId, packageData) => {
        try {
          const { collection, addDoc } = await import('firebase/firestore');
          const { db } = await import('../firebase');
          const docRef = await addDoc(collection(db, 'apps', appId, 'packages'), {
            ...packageData,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          return docRef.id;
        } catch (error) {
          console.error('Error adding app package:', error);
          throw error;
        }
      },

      updateAppPackage: async (appId, packageId, packageData) => {
        try {
          const { doc, updateDoc } = await import('firebase/firestore');
          const { db } = await import('../firebase');
          const packageRef = doc(db, 'apps', appId, 'packages', packageId);
          await updateDoc(packageRef, {
            ...packageData,
            updatedAt: new Date(),
          });
          return true;
        } catch (error) {
          console.error('Error updating app package:', error);
          throw error;
        }
      },

      deleteAppPackage: async (appId, packageId) => {
        try {
          const { doc, deleteDoc } = await import('firebase/firestore');
          const { db } = await import('../firebase');
          const packageRef = doc(db, 'apps', appId, 'packages', packageId);
          await deleteDoc(packageRef);
          return true;
        } catch (error) {
          console.error('Error deleting app package:', error);
          throw error;
        }
      },

      fetchAppContent: async (appId) => {
        try {
          const { doc, getDoc } = await import('firebase/firestore');
          const { db } = await import('../firebase');
          const docRef = doc(db, 'appContent', appId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) return docSnap.data();
          return null;
        } catch (error) {
          console.error('Error fetching app content:', error);
          return null;
        }
      },

      updateAppContent: async (appId, contentData) => {
        try {
          const { doc, setDoc } = await import('firebase/firestore');
          const { db } = await import('../firebase');
          await setDoc(doc(db, 'appContent', appId), {
            ...contentData,
            updatedAt: new Date().toISOString(),
          }, { merge: true });
          return true;
        } catch (error) {
          console.error('Error updating app content:', error);
          return false;
        }
      },

      services: [],
      setServices: (services) => set({ services }),

      navLinks: [],
      setNavLinks: (links) => set({ navLinks: links }),

      discounts: { games: 0, apps: 0, specific: {} },
      setDiscounts: (discounts) => set({ discounts }),
      getProductDiscount: (type, productId) => {
        const state = get();
        let discount = 0;
        if (type === 'game') {
          discount = state.discounts.games;
          const specific = state.discounts.specific[`game_${productId}`];
          if (specific) discount = Math.max(discount, specific);
        } else if (type === 'app') {
          discount = state.discounts.apps;
          const specific = state.discounts.specific[`app_${productId}`];
          if (specific) discount = Math.max(discount, specific);
        }
        return discount;
      },

      merchantDiscountPercent: 0,
      setMerchantDiscountPercent: (percent) => set({ merchantDiscountPercent: percent }),
      getMerchantDiscountPercent: () => {
        const state = get();
        return state.userData?.customerType === 'merchant' ? state.merchantDiscountPercent : 0;
      },

      updateTopUpSettings: async (settings) => {
        try {
          const docRef = doc(db, 'topUpSettings', 'default');
          await setDoc(docRef, {
            ...settings,
            updatedAt: new Date().toISOString(),
            updatedBy: get().user?.uid || 'admin'
          }, { merge: true });
          get().setTopUpSettings(settings);
          toast.success('تم حفظ إعدادات الإيداع بنجاح');
          return true;
        } catch (error) {
          console.error('خطأ في حفظ الإعدادات:', error);
          toast.error('فشل حفظ الإعدادات');
          return false;
        }
      },

      topUpSettings: null,
      setTopUpSettings: (settings) => set({ topUpSettings: settings }),

      storeSettings: null,
      setStoreSettings: (settings) => set({ storeSettings: settings }),

      paymentSettings: null,
      setPaymentSettings: (settings) => set({ paymentSettings: settings }),

      tickerSettings: null,
      setTickerSettings: (settings) => set({ tickerSettings: settings }),

            // ===== نظام الأصدقاء =====
      friendRequests: [],           // الطلبات الواردة الحالية
      friendsList: [],              // قائمة الأصدقاء المُضافة
      pendingRequestsCount: 0,      // عدد الطلبات غير المقروءة

      products: [],
      loadingProducts: false,
      setProducts: (products) => set({ products }),
      
      fetchProducts: async () => {
        const { setProducts, setLoadingProducts } = get();
        set({ loadingProducts: true });
        try {
          const { getDocs, collection } = await import('firebase/firestore');
          const { db } = await import('../firebase');
          const querySnapshot = await getDocs(collection(db, 'products'));
          const productsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setProducts(productsList);
        } catch (error) {
          console.error('❌ فشل جلب المنتجات:', error);
        } finally {
          set({ loadingProducts: false });
        }
      },
      
      setLoadingProducts: (loading) => set({ loadingProducts: loading }),
      
    }),
    {
      name: 'marsgo-storage',
      partialize: (state) => ({
        currency: state.currency,
        isDark: state.isDark,
        userData: state.userData,
        user: state.user,
        balance: state.balance,          // الرصيد الحقيقي
        mgcBalance: state.mgcBalance,    // رصيد MGC
      }),
    }
  )
);