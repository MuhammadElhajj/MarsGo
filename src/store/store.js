import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  doc, updateDoc, increment, onSnapshot, setDoc, 
  getDoc, addDoc, collection, serverTimestamp,
  query, where, orderBy, getDocs, onSnapshot as onSnapshotFirestore
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

      // ===== تحديث بيانات المستخدم (يستخدم في AuthContext) =====
      setUserData: (data) => set({
        userData: data,
        user: data?.user || data,
        balance: data?.balance || 0,          // الرصيد الحقيقي
        mgcBalance: data?.mgcBalance || 0,    // رصيد MGC
      }),

      setUserFull: (userData) => set({
        user: userData,
        userData: userData,
        balance: userData?.balance || 0,
        mgcBalance: userData?.mgcBalance || 0,
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

      // ===== دوال الصداقات =====
      addFriend: async (friendId) => {
        const { user, userData } = get();
        if (!user) return false;
        const currentFriends = userData?.friends || [];
        if (currentFriends.includes(friendId)) return true;
        const newFriends = [...currentFriends, friendId];
        await updateDoc(doc(db, 'users', user.uid), { friends: newFriends });
        set({ userData: { ...userData, friends: newFriends } });
        toast.success('تمت إضافة الصديق');
        return true;
      },

      removeFriend: async (friendId) => {
        const { user, userData } = get();
        if (!user) return false;
        const currentFriends = userData?.friends || [];
        const newFriends = currentFriends.filter(id => id !== friendId);
        await updateDoc(doc(db, 'users', user.uid), { friends: newFriends });
        set({ userData: { ...userData, friends: newFriends } });
        toast.success('تم إزالة الصديق');
        return true;
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