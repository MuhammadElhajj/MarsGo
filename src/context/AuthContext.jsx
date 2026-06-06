// import { createContext, useContext, useEffect, useState } from "react";
// import { onAuthStateChanged } from "firebase/auth";
// import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
// import { auth, db } from "../firebase";

// const AuthContext = createContext();

// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(null);
//   const [userData, setUserData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [emailVerified, setEmailVerified] = useState(false);

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
//       if (firebaseUser) {
//         // ✅ التحقق من البريد الإلكتروني
//         if (!firebaseUser.emailVerified) {
//           // البريد غير مفعل: نخزن المستخدم لكن لا نجلب البيانات
//           setUser(firebaseUser);
//           setUserData(null);
//           setEmailVerified(false);
//           setLoading(false);
//           return;
//         }

//         // البريد مفعل: نجلب البيانات من Firestore
//         const userRef = doc(db, "users", firebaseUser.uid);
//         const docSnap = await getDoc(userRef);
//         let data;
//         if (docSnap.exists()) {
//           data = docSnap.data();
//         } else {
//           data = {
//             name: firebaseUser.displayName || "مستخدم جديد",
//             email: firebaseUser.email,
//             role: "customer",
//             verifierType: "basic",
//             avatar: firebaseUser.photoURL || "",
//             createdAt: new Date(),
//           };
//           await setDoc(userRef, data);
//         }
//         data.uid = firebaseUser.uid;
//         setUserData(data);
//         setUser(firebaseUser);
//         setEmailVerified(true);
//       } else {
//         setUser(null);
//         setUserData(null);
//         setEmailVerified(false);
//       }
//       setLoading(false);
//     });
//     return unsubscribe;
//   }, []);

//   const updateUserData = async (updates) => {
//     if (!user) return;
//     try {
//       const userRef = doc(db, "users", user.uid);
//       await updateDoc(userRef, updates);
//       setUserData(prev => ({ ...prev, ...updates }));
//       return true;
//     } catch (error) {
//       console.error("Error updating user data:", error);
//       return false;
//     }
//   };

//   const value = { user, userData, loading, emailVerified, updateUserData };
//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// }

// export const useAuth = () => useContext(AuthContext);


// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // ✅ التحقق من البريد الإلكتروني
        if (!firebaseUser.emailVerified) {
          // البريد غير مفعل: نخزن المستخدم لكن لا نجلب البيانات
          setUser(firebaseUser);
          setUserData(null);
          setEmailVerified(false);
          setLoading(false);
          return;
        }

        // البريد مفعل: نجلب البيانات من Firestore
        const userRef = doc(db, "users", firebaseUser.uid);
        const docSnap = await getDoc(userRef);
        let data;
        if (docSnap.exists()) {
          data = docSnap.data();
          // ✅ التحقق من وجود customerType وإضافته إذا كان مفقوداً (للمستخدمين القدامى)
          if (!data.customerType) {
            data.customerType = 'customer';
            await updateDoc(userRef, { customerType: 'customer' });
          }
        } else {
          // ✅ مستخدم جديد: نضيف customerType مع باقي الحقول
          data = {
            name: firebaseUser.displayName || "مستخدم جديد",
            email: firebaseUser.email,
            role: "customer",
            verifierType: "basic",
            customerType: "customer",   // <-- الحقل الجديد
            avatar: firebaseUser.photoURL || "",
            createdAt: new Date(),
          };
          await setDoc(userRef, data);
        }
        data.uid = firebaseUser.uid;
        setUserData(data);
        setUser(firebaseUser);
        setEmailVerified(true);
      } else {
        setUser(null);
        setUserData(null);
        setEmailVerified(false);
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
      setUserData(prev => ({ ...prev, ...updates }));
      return true;
    } catch (error) {
      console.error("Error updating user data:", error);
      return false;
    }
  };

  // ✅ القيمة المُرجعة تشمل customerType
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