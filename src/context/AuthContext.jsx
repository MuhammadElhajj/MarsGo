

// import { createContext, useContext, useEffect, useState } from "react";
// import { onAuthStateChanged } from "firebase/auth";
// import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
// import { auth, db } from "../firebase";
// import { useAppStore } from '../store/store';

// const AuthContext = createContext();

// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(null);
//   const [userData, setUserData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [emailVerified, setEmailVerified] = useState(false);

//   // ✅ جلب دوال الـ Store لتحديثها (باستخدام الأسماء الجديدة)
//   const setStoreUser = useAppStore((state) => state.setUser);
//   const setStoreUserData = useAppStore((state) => state.setUserData);
//   const setStoreBalance = useAppStore((state) => state.setBalance);          // الرصيد الحقيقي
//   const setStoreMgcBalance = useAppStore((state) => state.setMgcBalance);    // رصيد MGC
//   // ✅ جلب دالة توليد المعرف الفريد
//   const generateUniqueId = useAppStore((state) => state.generateUniqueId);

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
//       if (firebaseUser) {
//         // ✅ التحقق من البريد الإلكتروني
//         if (!firebaseUser.emailVerified) {
//           // البريد غير مفعل: نخزن المستخدم لكن لا نجلب البيانات
//           setUser(firebaseUser);
//           setUserData(null);
//           setEmailVerified(false);
//           // ✅ مزامنة الـ Store (المستخدم موجود لكن بدون بيانات)
//           setStoreUser(firebaseUser);
//           setStoreUserData(null);
//           setStoreBalance(0);
//           setStoreMgcBalance(0);
//           setLoading(false);
//           return;
//         }

//         // البريد مفعل: نجلب البيانات من Firestore
//         const userRef = doc(db, "users", firebaseUser.uid);
//         const docSnap = await getDoc(userRef);
//         let data;
//         if (docSnap.exists()) {
//           data = docSnap.data();
//           // ✅ التحقق من وجود الحقول الجديدة وإضافتها بقيم افتراضية إذا كانت مفقودة
//           let needsUpdate = false;

//           // التحقق من وجود uniqueId
//           if (!data.uniqueId) {
//             const uniqueId = await generateUniqueId();
//             data.uniqueId = uniqueId;
//             needsUpdate = true;
//           }

//           // ============================================================
//           // 🔽 **إضافة حقول الإحالة للمستخدمين القدامى (اختياري)**
//           // في حال كنت تريد إضافة الحقول للمستخدمين الموجودين مسبقاً،
//           // يمكنك إلغاء التعليق على هذا القسم.
//           // ============================================================
//           /*
//           if (data.referredBy === undefined) {
//             data.referredBy = null;
//             needsUpdate = true;
//           }
//           if (data.referralBalance === undefined) {
//             data.referralBalance = 0;
//             needsUpdate = true;
//           }
//           if (data.totalReferralEarnings === undefined) {
//             data.totalReferralEarnings = 0;
//             needsUpdate = true;
//           }
//           if (data.referralRewardClaimed === undefined) {
//             data.referralRewardClaimed = false;
//             needsUpdate = true;
//           }
//           */

//           if (!data.customerType) {
//             data.customerType = 'customer';
//             needsUpdate = true;
//           }
//           if (!data.friends) {
//             data.friends = [];
//             needsUpdate = true;
//           }
//           if (!data.blockedUsers) {
//             data.blockedUsers = [];
//             needsUpdate = true;
//           }
//           if (data.popularity === undefined) {
//             data.popularity = 0;
//             needsUpdate = true;
//           }
//           if (data.power === undefined) {
//             data.power = 0;
//             needsUpdate = true;
//           }
//           if (!data.rank) {
//             data.rank = 'عضو';
//             needsUpdate = true;
//           }
//           // ✅ التحقق من وجود الرصيد الحقيقي (balance) ورصيد MGC (mgcBalance)
//           if (data.balance === undefined) {
//             data.balance = 0;
//             needsUpdate = true;
//           }
//           if (data.mgcBalance === undefined) {
//             data.mgcBalance = 0;
//             needsUpdate = true;
//           }
//           if (data.xp === undefined) {
//             data.xp = 0;
//             needsUpdate = true;
//           }
//           if (data.level === undefined) {
//             data.level = 1;
//             needsUpdate = true;
//           }
//           if (data.title === undefined) {
//             data.title = null;
//             needsUpdate = true;
//           }
//           if (data.pityCounter === undefined) {
//             data.pityCounter = 0;
//             needsUpdate = true;
//           }
//           if (data.coupons === undefined) {
//             data.coupons = [];
//             needsUpdate = true;
//           }
//           if (data.freeCoupons === undefined) {
//             data.freeCoupons = [];
//             needsUpdate = true;
//           }

//           if (needsUpdate) {
//             await updateDoc(userRef, {
//               customerType: data.customerType,
//               friends: data.friends,
//               blockedUsers: data.blockedUsers,
//               popularity: data.popularity,
//               power: data.power,
//               rank: data.rank,
//               balance: data.balance,
//               mgcBalance: data.mgcBalance,
//               xp: data.xp,
//               level: data.level,
//               title: data.title,
//               pityCounter: data.pityCounter,
//               coupons: data.coupons,
//               freeCoupons: data.freeCoupons,
//               uniqueId: data.uniqueId, // ✅ إضافة المعرف الفريد
//             });
//           }
//         } else {
//           // ============================================================
//           // ✅ **مستخدم جديد: نضيف جميع الحقول المطلوبة**
//           // 🔽 **هنا تمت إضافة قراءة كود الإحالة من الرابط وحفظه**
//           // ============================================================

//           // ----- قراءة كود الإحالة من الرابط (ref) -----
//           let referredBy = null;
//           try {
//             const queryParams = new URLSearchParams(window.location.search);
//             const refCode = queryParams.get('ref'); // مثال: MGC_00000001
//             if (refCode) {
//               const q = query(collection(db, 'users'), where('uniqueId', '==', refCode));
//               const snap = await getDocs(q);
//               if (!snap.empty) {
//                 referredBy = snap.docs[0].id; // نأخذ uid المستخدم المُحيل
//                 console.log(`✅ تم العثور على المُحيل: ${referredBy}`);
//               } else {
//                 console.warn(`⚠️ لم يتم العثور على مستخدم بالمعرف: ${refCode}`);
//               }
//             }
//           } catch (err) {
//             console.warn('⚠️ خطأ في قراءة كود الإحالة:', err);
//           }
//           // ----- انتهى جزء الإحالة -----

//           // توليد معرف فريد قبل إنشاء الوثيقة
//           const displayName = firebaseUser.displayName || "مستخدم جديد";
//           const uniqueId = await generateUniqueId();

//           data = {
//             name: displayName,
//             email: firebaseUser.email,
//             role: "customer",
//             verifierType: "basic",
//             customerType: "customer",
//             avatar: firebaseUser.photoURL || "",
//             createdAt: new Date(),
//             friends: [],
//             blockedUsers: [],
//             popularity: 0,
//             power: 0,
//             rank: 'عضو',
//             balance: 0,
//             mgcBalance: 0,
//             xp: 0,
//             level: 1,
//             title: null,
//             pityCounter: 0,
//             coupons: [],
//             freeCoupons: [],
//             uniqueId: uniqueId,
//             // ============================================================
//             // 🔽 **الحقول الجديدة لنظام الإحالة** (تم إضافتها هنا)
//             // ============================================================
//             referredBy: referredBy,           // ✅ المُحيل (uid)
//             referralBalance: 0,               // ✅ رصيد الإحالات المحجوز
//             totalReferralEarnings: 0,         // ✅ إجمالي ما تم تحويله إلى الرصيد الرئيسي
//             referralRewardClaimed: false,     // ✅ لمنع تكرار المكافأة (اختياري)
//           };
//           await setDoc(userRef, data);
//         }
//         data.uid = firebaseUser.uid;

//         // ✅ تحديث الحالة المحلية
//         setUserData(data);
//         setUser(firebaseUser);
//         setEmailVerified(true);

//         // ✅ مزامنة الـ Store مع البيانات الكاملة
//         setStoreUser(firebaseUser);
//         setStoreUserData(data);
//         setStoreBalance(data.balance || 0);
//         setStoreMgcBalance(data.mgcBalance || 0);

//       } else {
//         // ✅ تسجيل الخروج: مسح الحالة المحلية والـ Store
//         setUser(null);
//         setUserData(null);
//         setEmailVerified(false);
//         setStoreUser(null);
//         setStoreUserData(null);
//         setStoreBalance(0);
//         setStoreMgcBalance(0);
//       }
//       setLoading(false);
//     });
//     return unsubscribe;
//   }, []);

//   // دالة لتحديث بيانات المستخدم
//   const updateUserData = async (updates) => {
//     if (!user) return false;
//     try {
//       const userRef = doc(db, "users", user.uid);
//       await updateDoc(userRef, updates);
//       // تحديث الحالة المحلية
//       const newData = { ...userData, ...updates };
//       setUserData(newData);
//       // ✅ تحديث الـ Store أيضاً بعد التعديل
//       setStoreUserData(newData);
//       if (updates.balance !== undefined) {
//         setStoreBalance(updates.balance);
//       }
//       if (updates.mgcBalance !== undefined) {
//         setStoreMgcBalance(updates.mgcBalance);
//       }
//       return true;
//     } catch (error) {
//       console.error("Error updating user data:", error);
//       return false;
//     }
//   };

//   // ✅ القيمة المُرجعة
//   const value = {
//     user,
//     userData,
//     loading,
//     emailVerified,
//     updateUserData,
//     customerType: userData?.customerType || 'customer'
//   };

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// }

// export const useAuth = () => useContext(AuthContext);



import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useAppStore } from '../store/store';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);

  // ✅ جلب دوال الـ Store لتحديثها
  const setStoreUser = useAppStore((state) => state.setUser);
  const setStoreUserData = useAppStore((state) => state.setUserData);
  const setStoreBalance = useAppStore((state) => state.setBalance);
  const setStoreMgcBalance = useAppStore((state) => state.setMgcBalance);
  
  // ✅ جلب دوال توليد المعرف الفريد والفيزا والرقم السري
  const generateUniqueId = useAppStore((state) => state.generateUniqueId);
  const generateVisaNumber = useAppStore((state) => state.generateVisaNumber);
  const generateVisaSecret = useAppStore((state) => state.generateVisaSecret);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // ✅ التحقق من البريد الإلكتروني
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

        // البريد مفعل: نجلب البيانات من Firestore
        const userRef = doc(db, "users", firebaseUser.uid);
        const docSnap = await getDoc(userRef);
        let data;
        if (docSnap.exists()) {
          data = docSnap.data();
          let needsUpdate = false;

          // ===== التحقق من وجود uniqueId =====
          if (!data.uniqueId) {
            const uniqueId = await generateUniqueId();
            data.uniqueId = uniqueId;
            needsUpdate = true;
          }

          // ===== إضافة visaNumber و visaSecret للمستخدمين القدامى =====
          if (!data.visaNumber) {
            try {
              const newVisa = await generateVisaNumber(firebaseUser.uid);
              data.visaNumber = newVisa;
              needsUpdate = true;
            } catch (err) {
              console.warn('⚠️ فشل توليد رقم الفيزا:', err);
            }
          }
          if (!data.visaSecret) {
            data.visaSecret = generateVisaSecret();
            needsUpdate = true;
          }

          // ===== باقي الحقول الاختيارية =====
          if (!data.customerType) {
            data.customerType = 'customer';
            needsUpdate = true;
          }
          if (!data.friends) {
            data.friends = [];
            needsUpdate = true;
          }
          if (!data.blockedUsers) {
            data.blockedUsers = [];
            needsUpdate = true;
          }
          if (data.popularity === undefined) {
            data.popularity = 0;
            needsUpdate = true;
          }
          if (data.power === undefined) {
            data.power = 0;
            needsUpdate = true;
          }
          if (!data.rank) {
            data.rank = 'عضو';
            needsUpdate = true;
          }
          if (data.balance === undefined) {
            data.balance = 0;
            needsUpdate = true;
          }
          if (data.mgcBalance === undefined) {
            data.mgcBalance = 0;
            needsUpdate = true;
          }
          if (data.xp === undefined) {
            data.xp = 0;
            needsUpdate = true;
          }
          if (data.level === undefined) {
            data.level = 1;
            needsUpdate = true;
          }
          if (data.title === undefined) {
            data.title = null;
            needsUpdate = true;
          }
          if (data.pityCounter === undefined) {
            data.pityCounter = 0;
            needsUpdate = true;
          }
          if (data.coupons === undefined) {
            data.coupons = [];
            needsUpdate = true;
          }
          if (data.freeCoupons === undefined) {
            data.freeCoupons = [];
            needsUpdate = true;
          }

          // ===== حفظ التحديثات إذا لزم الأمر =====
          if (needsUpdate) {
            await updateDoc(userRef, {
              customerType: data.customerType,
              friends: data.friends,
              blockedUsers: data.blockedUsers,
              popularity: data.popularity,
              power: data.power,
              rank: data.rank,
              balance: data.balance,
              mgcBalance: data.mgcBalance,
              xp: data.xp,
              level: data.level,
              title: data.title,
              pityCounter: data.pityCounter,
              coupons: data.coupons,
              freeCoupons: data.freeCoupons,
              uniqueId: data.uniqueId,
              visaNumber: data.visaNumber,    // ✅ إضافة رقم الفيزا
              visaSecret: data.visaSecret,     // ✅ إضافة الرقم السري
            });
          }
        } else {
          // ============================================================
          // ✅ **مستخدم جديد: نضيف جميع الحقول المطلوبة**
          // ============================================================

          // ===== قراءة كود الإحالة (من sessionStorage أو الرابط) =====
          let referredBy = null;
          let refCode = null;
          try {
            // 1. محاولة قراءة من sessionStorage (من SignupPage)
            refCode = sessionStorage.getItem('referralCode');
            
            // 2. إذا لم يكن في sessionStorage، نقرأ من الرابط
            if (!refCode) {
              const queryParams = new URLSearchParams(window.location.search);
              refCode = queryParams.get('ref');
            }
            
            if (refCode) {
              const q = query(collection(db, 'users'), where('uniqueId', '==', refCode));
              const snap = await getDocs(q);
              if (!snap.empty) {
                referredBy = snap.docs[0].id;
                console.log(`✅ تم العثور على المُحيل: ${referredBy}`);
              } else {
                console.warn(`⚠️ لم يتم العثور على مستخدم بالمعرف: ${refCode}`);
              }
            }
          } catch (err) {
            console.warn('⚠️ خطأ في قراءة كود الإحالة:', err);
          } finally {
            // مسح sessionStorage بعد الاستخدام (سواء نجح أو فشل)
            if (refCode) {
              sessionStorage.removeItem('referralCode');
            }
          }

          // توليد المعرف الفريد ورقم الفيزا والرقم السري
          const displayName = firebaseUser.displayName || "مستخدم جديد";
          const uniqueId = await generateUniqueId();
          const visaNumber = await generateVisaNumber(firebaseUser.uid);
          const visaSecret = generateVisaSecret();

          data = {
            name: displayName,
            email: firebaseUser.email,
            role: "customer",
            verifierType: "basic",
            customerType: "customer",
            avatar: firebaseUser.photoURL || "",
            createdAt: new Date(),
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
            visaNumber: visaNumber,          // ✅ رقم الفيزا الفريد
            visaSecret: visaSecret,           // ✅ الرقم السري
            // حقول الإحالة
            referredBy: referredBy,
            referralBalance: 0,
            totalReferralEarnings: 0,
            referralRewardClaimed: false,
          };
          await setDoc(userRef, data);
        }
        data.uid = firebaseUser.uid;

        // ✅ تحديث الحالة المحلية
        setUserData(data);
        setUser(firebaseUser);
        setEmailVerified(true);

        // ✅ مزامنة الـ Store مع البيانات الكاملة
        setStoreUser(firebaseUser);
        setStoreUserData(data);
        setStoreBalance(data.balance || 0);
        setStoreMgcBalance(data.mgcBalance || 0);

      } else {
        // ✅ تسجيل الخروج: مسح الحالة المحلية والـ Store
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
    return unsubscribe;
  }, []);

  // دالة لتحديث بيانات المستخدم
  const updateUserData = async (updates) => {
    if (!user) return false;
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, updates);
      const newData = { ...userData, ...updates };
      setUserData(newData);
      setStoreUserData(newData);
      if (updates.balance !== undefined) setStoreBalance(updates.balance);
      if (updates.mgcBalance !== undefined) setStoreMgcBalance(updates.mgcBalance);
      return true;
    } catch (error) {
      console.error("Error updating user data:", error);
      return false;
    }
  };

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