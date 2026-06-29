import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useAppStore } from '../store/store';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);

  // دوال الـ Store لتحديثها
  const setStoreUser = useAppStore((state) => state.setUser);
  const setStoreUserData = useAppStore((state) => state.setUserData);
  const setStoreBalance = useAppStore((state) => state.setBalance);
  const setStoreMgcBalance = useAppStore((state) => state.setMgcBalance);

  // دوال توليد المعرف الفريد والفيزا والرقم السري
  const generateUniqueId = useAppStore((state) => state.generateUniqueId);
  const generateVisaNumber = useAppStore((state) => state.generateVisaNumber);
  const generateVisaSecret = useAppStore((state) => state.generateVisaSecret);

  // دالة لتحديث بيانات المستخدم - useCallback لتقليل re-renders
  const updateUserData = useCallback(async (updates) => {
    if (!user) return false;
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { ...updates, updatedAt: new Date() });
      const newData = { ...userData, ...updates };
      setUserData(newData);
      setStoreUserData(newData);
      if (updates.balance !== undefined) setStoreBalance(updates.balance);
      if (updates.mgcBalance !== undefined) setStoreMgcBalance(updates.mgcBalance);
      return true;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("❌ Error updating user data:", error.message);
      }
      return false;
    }
  }, [user, userData, setStoreUserData, setStoreBalance, setStoreMgcBalance]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // التحقق من البريد الإلكتروني
        if (!firebaseUser.emailVerified) {
          setUser(firebaseUser);
          setUserData(null);
          setEmailVerified(false);
          setStoreUser(firebaseUser);
          setStoreUserData(null);
          setStoreBalance(0);
          setStoreMgcBalance(0);
          setLoading(false);
          return;
        }

        const userRef = doc(db, "users", firebaseUser.uid);
        const docSnap = await getDoc(userRef);
        let data;

        if (docSnap.exists()) {
          data = docSnap.data();

          // ===== التحقق من الحقول الأساسية وإضافتها إذا كانت مفقودة =====
          const updates = {};

          if (!data.uniqueId) {
            try {
              updates.uniqueId = await generateUniqueId();
            } catch (err) {
              // ignore
            }
          }
          if (!data.visaNumber) {
            try {
              updates.visaNumber = await generateVisaNumber(firebaseUser.uid);
            } catch (err) {
              // ignore
            }
          }
          if (!data.visaSecret) {
            updates.visaSecret = generateVisaSecret();
          }

          // الحقول الافتراضية
          const defaults = {
            customerType: 'customer',
            friends: [],
            blockedUsers: [],
            popularity: 0,
            power: 0,
            rank: 'عضو',
            balance: 0,
            mgcBalance: 0,
            xp: 0,
            level: 1,
            title: null,
            pityCounter: 0,
            coupons: [],
            freeCoupons: [],
            referralBalance: 0,
            totalReferralEarnings: 0,
            referralRewardClaimed: false,
            referredBy: null,
            membership: null,
            membershipExpiry: null,
            lastActive: new Date(),
          };

          for (const [key, value] of Object.entries(defaults)) {
            if (data[key] === undefined) {
              updates[key] = value;
            }
          }

          // ===== حفظ التحديثات إذا لزم الأمر =====
          if (Object.keys(updates).length > 0) {
            await updateDoc(userRef, updates);
            data = { ...data, ...updates };
          }
        } else {
          // ============================================================
          // ✅ **مستخدم جديد: نضيف جميع الحقول المطلوبة**
          // ============================================================

          let referredBy = null;
          let refCode = null;

          try {
            // ✅ استخدام localStorage بدل sessionStorage (أكثر ثباتاً)
            refCode = localStorage.getItem('referralCode');
            if (!refCode) {
              const queryParams = new URLSearchParams(window.location.search);
              refCode = queryParams.get('ref');
            }
            if (refCode) {
              const q = query(collection(db, 'users'), where('uniqueId', '==', refCode));
              const snap = await getDocs(q);
              if (!snap.empty) {
                referredBy = snap.docs[0].id;
              }
            }
          } catch (err) {
            // ignore referral errors silently in production
          } finally {
            if (refCode) {
              localStorage.removeItem('referralCode');
              sessionStorage.removeItem('referralCode');
            }
          }

          const tempName = sessionStorage.getItem('temp_user_name');
          if (tempName) sessionStorage.removeItem('temp_user_name');

          let displayName = firebaseUser.displayName;
          if (!displayName && tempName) {
            displayName = tempName;
          } else if (!displayName) {
            const emailPart = firebaseUser.email?.split('@')[0] || '';
            displayName = emailPart
              .replace(/[._-]/g, ' ')
              .replace(/\b\w/g, char => char.toUpperCase())
              .trim();
            if (!displayName) displayName = 'مستخدم';
          }

          const uniqueId = await generateUniqueId();
          const visaNumber = await generateVisaNumber(firebaseUser.uid);
          const visaSecret = generateVisaSecret();
          const now = new Date();

          data = {
            name: displayName,
            email: firebaseUser.email,
            role: "customer",
            verifierType: "basic",
            customerType: "customer",
            avatar: firebaseUser.photoURL || "",
            createdAt: now,
            updatedAt: now,
            lastActive: now,
            friends: [],
            blockedUsers: [],
            popularity: 0,
            power: 0,
            rank: 'عضو',
            balance: 0,
            mgcBalance: 0,
            xp: 0,
            level: 1,
            title: null,
            pityCounter: 0,
            coupons: [],
            freeCoupons: [],
            uniqueId: uniqueId,
            visaNumber: visaNumber,
            visaSecret: visaSecret,
            referredBy: referredBy,
            referralBalance: 0,
            totalReferralEarnings: 0,
            referralRewardClaimed: false,
            membership: null,
            membershipExpiry: null,
          };

          await setDoc(userRef, data);

          // إنشاء سجل إحالة إذا كان هناك مُحيل
          if (referredBy) {
            try {
              await addDoc(collection(db, 'referral_rewards'), {
                referrerId: referredBy,
                referredId: firebaseUser.uid,
                rewardAmount: 20,
                status: 'pending',
                createdAt: serverTimestamp(),
              });
            } catch (err) {
              // ignore silently
            }
          }
        }

        // إضافة uid إلى data
        data.uid = firebaseUser.uid;

        // تحديث الحالة المحلية
        setUserData(data);
        setUser(firebaseUser);
        setEmailVerified(true);

        // مزامنة الـ Store
        setStoreUser(firebaseUser);
        setStoreUserData(data);
        setStoreBalance(data.balance || 0);
        setStoreMgcBalance(data.mgcBalance || 0);

      } else {
        // تسجيل الخروج: مسح الحالة
        setUser(null);
        setUserData(null);
        setEmailVerified(false);
        setStoreUser(null);
        setStoreUserData(null);
        setStoreBalance(0);
        setStoreMgcBalance(0);
      }
      setLoading(false);
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = {
    user,
    userData,
    loading,
    emailVerified,
    updateUserData,
    customerType: userData?.customerType || 'customer'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);