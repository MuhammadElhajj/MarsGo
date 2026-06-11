import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { doc, updateDoc, increment, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';

export const useAppStore = create(
  persist(
    (set, get) => ({
      // ========== المستخدم والجلسة ==========
      user: null,
      userData: null,
      setUser: (user) => set({ user }),
      setUserData: (data) => set({ userData: data }),

      // ========== الرصيد ==========
      balance: 0,
      setBalance: (balance) => set({ balance }),

      // الاستماع لتغيرات الرصيد في الوقت الفعلي
      listenToBalance: (userId) => {
        if (!userId) return () => {};
        const userRef = doc(db, 'users', userId);
        const unsubscribe = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const newBalance = docSnap.data().balance || 0;
            get().setBalance(newBalance);
          }
        }, (error) => {
          console.error('خطأ في الاستماع للرصيد:', error);
        });
        return unsubscribe;
      },

      // ========== دوال خصم وإضافة الرصيد مع تحديث Firestore ==========
      deductBalance: async (amountUSD) => {
        const { user, balance, setBalance } = get();
        if (!user) {
          toast.error('يجب تسجيل الدخول أولاً');
          return false;
        }
        if (balance < amountUSD) {
          toast.error('رصيد غير كافٍ، يرجى شحن الرصيد أولاً');
          return false;
        }
        try {
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, { balance: increment(-amountUSD) });
          setBalance(balance - amountUSD);
          toast.success(`تم خصم ${amountUSD.toFixed(2)} $ من رصيدك`);
          return true;
        } catch (error) {
          console.error('فشل الخصم:', error);
          toast.error('حدث خطأ أثناء خصم الرصيد');
          return false;
        }
      },

      addBalance: async (userId, amountUSD) => {
        try {
          const userRef = doc(db, 'users', userId);
          await updateDoc(userRef, { balance: increment(amountUSD) });
          const { user, balance, setBalance } = get();
          if (user && user.uid === userId) {
            setBalance(balance + amountUSD);
          }
          return true;
        } catch (error) {
          console.error('فشل إضافة الرصيد:', error);
          return false;
        }
      },

      // ========== العملة ==========
      currency: 'USD',
      toggleCurrency: () => set((state) => ({ currency: state.currency === 'USD' ? 'SYP' : 'USD' })),

      // ========== الثيم ==========
      isDark: false,
      toggleTheme: () => set((state) => ({ isDark: !state.isDark })),

      // ========== سعر الصرف ==========
      exchangeRate: 15000,
      setExchangeRate: (rate) => set({ exchangeRate: rate }),
      autoSyncExchangeRate: true,
      setAutoSyncExchangeRate: (auto) => set({ autoSyncExchangeRate: auto }),

      // ========== الإشعارات ==========
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

      // ========== الألعاب ==========
      games: [],
      setGames: (games) => set({ games }),

      // ========== التطبيقات ==========
      apps: [],
      setApps: (apps) => set({ apps }),

      // ========== الخدمات ==========
      services: [],
      setServices: (services) => set({ services }),

      // ========== روابط التنقل ==========
      navLinks: [],
      setNavLinks: (links) => set({ navLinks: links }),

      // ========== الخصومات العامة والخاصة ==========
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

      // ========== خصم التجار ==========
      merchantDiscountPercent: 0,
      setMerchantDiscountPercent: (percent) => set({ merchantDiscountPercent: percent }),
      getMerchantDiscountPercent: () => {
        const state = get();
        return state.userData?.customerType === 'merchant' ? state.merchantDiscountPercent : 0;
      },

      // ========== إعدادات الإيداع (TopUp) ==========
      topUpSettings: null,
      setTopUpSettings: (settings) => set({ topUpSettings: settings }),

      // ========== إعدادات المتجر (صور الخلفية، إلخ) ==========
      storeSettings: null,
      setStoreSettings: (settings) => set({ storeSettings: settings }),

      // ========== إعدادات الدفع (QR، حساب بنكي) ==========
      paymentSettings: null,
      setPaymentSettings: (settings) => set({ paymentSettings: settings }),

      // ========== شريط الأخبار المتحرك (Ticker) ==========
      tickerSettings: null,
      setTickerSettings: (settings) => set({ tickerSettings: settings }),
    }),
    {
      name: 'marsgo-storage',
      partialize: (state) => ({
        currency: state.currency,
        isDark: state.isDark,
        userData: state.userData,
      }),
    }
  )
);