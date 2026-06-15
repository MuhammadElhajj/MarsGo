import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { doc, updateDoc, increment, onSnapshot, setDoc } from 'firebase/firestore';
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
      exchangeRate: 145,
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

      // ========== دوال إدارة الألعاب (الحالية – لم نغيرها) ==========
      loading: false,
      setLoading: (loading) => set({ loading }),

      fetchPackages: async () => {
        // موجودة كما هي (فقط مثال)
        const { setLoading } = get();
        setLoading(true);
        try {
          const { collection, getDocs } = await import('firebase/firestore');
          const { db } = await import('../firebase');
          const snapshot = await getDocs(collection(db, 'packages'));
          const packages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          // يمكنك تخزين الباقات في الـ store إذا أردت
          // set({ packages });
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
          const { doc, deleteDoc } = await import('firebase/firestore');
          const { db } = await import('../firebase');
          const gameRef = doc(db, 'games', id);
          await deleteDoc(gameRef);
          const filteredGames = games.filter(g => g.id !== id);
          setGames(filteredGames);
          return true;
        } catch (error) {
          console.error('Error deleting game:', error);
          return false;
        }
      },

      // ===== دوال باقات الألعاب (جديدة – مع الحفاظ على القديمة) =====
      addGamePackage: async (gameId, packageData) => {
        // هنا يمكنك إضافة باقة إلى لعبة محددة (subcollection)
        console.log('Adding game package:', gameId, packageData);
        return true;
      },
      updateGamePackage: async (gameId, packageId, packageData) => {
        console.log('Updating game package:', gameId, packageId, packageData);
        return true;
      },
      deleteGamePackage: async (gameId, packageId) => {
        console.log('Deleting game package:', gameId, packageId);
        return true;
      },
      fetchGamePackages: async (gameId) => {
        console.log('Fetching game packages:', gameId);
        return [];
      },

      // ========== التطبيقات (جديدة) ==========
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
          const { doc, deleteDoc } = await import('firebase/firestore');
          const { db } = await import('../firebase');
          const appRef = doc(db, 'apps', id);
          await deleteDoc(appRef);
          const filteredApps = apps.filter(a => a.id !== id);
          setApps(filteredApps);
          return true;
        } catch (error) {
          console.error('Error deleting app:', error);
          return false;
        }
      },

      // ===== دوال باقات التطبيقات =====
      addAppPackage: async (appId, packageData) => {
        console.log('Adding app package:', appId, packageData);
        return true;
      },
      updateAppPackage: async (appId, packageId, packageData) => {
        console.log('Updating app package:', appId, packageId, packageData);
        return true;
      },
      deleteAppPackage: async (appId, packageId) => {
        console.log('Deleting app package:', appId, packageId);
        return true;
      },
      fetchAppPackages: async (appId) => {
        console.log('Fetching app packages:', appId);
        return [];
      },

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

      // ========== إعدادات المتجر (صور الخلفية، إلخ) ==========
      storeSettings: null,
      setStoreSettings: (settings) => set({ storeSettings: settings }),

      // ========== إعدادات الدفع (QR، حساب بنكي) ==========
      paymentSettings: null,
      setPaymentSettings: (settings) => set({ paymentSettings: settings }),

      // ========== شريط الأخبار المتحرك (Ticker) ==========
      tickerSettings: null,
      setTickerSettings: (settings) => set({ tickerSettings: settings }),

      // ========== المنتجات الديناميكية (المستوردة من المتجر الخارجي) ==========
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
      }),
    }
  )
);