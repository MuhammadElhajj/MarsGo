

// src/store/store.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createAuthSlice } from './slices/authSlice';
import { createBalanceSlice } from './slices/balanceSlice';
import { createGameSlice } from './slices/gameSlice';
import { createClanSlice } from './slices/clanSlice';
import { createFriendSlice } from './slices/friendSlice';
import { createReferralSlice } from './slices/referralSlice';
import { createRoomSlice } from './slices/roomSlice';
import { createWheelSlice } from './slices/wheelSlice';
import { createUISlice } from './slices/uiSlice';
import { createVisaSlice } from './slices/visaSlice';
import { createOrderSlice } from './slices/orderSlice';

// ===== دمج جميع الـ slices =====
const createRootSlice = (set, get) => ({
  ...createAuthSlice(set, get),
  ...createBalanceSlice(set, get),
  ...createGameSlice(set, get),
  ...createClanSlice(set, get),
  ...createFriendSlice(set, get),
  ...createReferralSlice(set, get),
  ...createRoomSlice(set, get),
  ...createWheelSlice(set, get),
  ...createUISlice(set, get),
  ...createVisaSlice(set, get),
  ...createOrderSlice(set, get),
});

// ===== إنشاء الـ store مع persist =====
export const useAppStore = create(
  persist(
    createRootSlice,
    {
      name: 'marsgo-storage', // ✅ نفس المفتاح القديم لضمان استمرارية البيانات
      partialize: (state) => ({
        currency: state.currency,
        isDark: state.isDark,
        userData: state.userData,
        user: state.user,
        balance: state.balance,
        mgcBalance: state.mgcBalance,
        referralBalance: state.referralBalance,
        // يمكن إضافة حقول أخرى إذا أردت حفظها
      }),
    }
  )
);

// تصدير الـ store بنفس الاسم القديم للتوافق مع الاستيرادات
export default useAppStore;