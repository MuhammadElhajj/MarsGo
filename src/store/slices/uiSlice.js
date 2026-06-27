// src/store/slices/uiSlice.js
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import toast from 'react-hot-toast';

export const createUISlice = (set, get) => ({
  // ===== العملة =====
  currency: 'USD',
  toggleCurrency: () => set((state) => ({ currency: state.currency === 'USD' ? 'SYP' : 'USD' })),

  // ===== الثيم =====
  isDark: false,
  toggleTheme: () => set((state) => ({ isDark: !state.isDark })),

  // ===== سعر الصرف =====
  exchangeRate: 145,
  setExchangeRate: (rate) => set({ exchangeRate: rate }),
  listenToExchangeRate: () => {
    const unsub = onSnapshot(doc(db, 'exchangeRate', 'default'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.value) {
          set({ exchangeRate: data.value });
        }
      }
    }, (error) => {
      console.error('خطأ في الاستماع لسعر الصرف:', error);
    });
    return unsub;
  },

  // ===== إعدادات الإيداع =====
  topUpSettings: null,
  setTopUpSettings: (settings) => set({ topUpSettings: settings }),
  listenToTopUpSettings: () => {
    const unsub = onSnapshot(doc(db, 'topUpSettings', 'default'), (docSnap) => {
      if (docSnap.exists()) {
        set({ topUpSettings: docSnap.data() });
      } else {
        set({ topUpSettings: null });
      }
    }, (error) => {
      console.error('خطأ في الاستماع لإعدادات الإيداع:', error);
    });
    return unsub;
  },

  updateTopUpSettings: async (settings) => {
    try {
      const docRef = doc(db, 'topUpSettings', 'default');
      await setDoc(docRef, {
        ...settings,
        updatedAt: new Date().toISOString(),
        updatedBy: get().user?.uid || 'admin'
      }, { merge: true });
      set({ topUpSettings: settings });
      toast.success('تم حفظ إعدادات الإيداع بنجاح');
      return true;
    } catch (error) {
      console.error('خطأ في حفظ الإعدادات:', error);
      toast.error('فشل حفظ الإعدادات');
      return false;
    }
  },

  // ===== إعدادات المتجر =====
  storeSettings: null,
  setStoreSettings: (settings) => set({ storeSettings: settings }),

  // ===== إعدادات الدفع =====
  paymentSettings: null,
  setPaymentSettings: (settings) => set({ paymentSettings: settings }),

  // ===== إعدادات الشريط المتحرك =====
  tickerSettings: null,
  setTickerSettings: (settings) => set({ tickerSettings: settings }),

  // ===== الإشعارات =====
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
  markAllNotificationsRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, read: true })),
    unreadCount: 0
  })),
});