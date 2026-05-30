import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, "users", firebaseUser.uid);
        const docSnap = await getDoc(userRef);
        let data;
        if (docSnap.exists()) {
          data = docSnap.data();
        } else {
          data = {
            name: firebaseUser.displayName || "مستخدم جديد",
            email: firebaseUser.email,
            role: "customer",
            avatar: firebaseUser.photoURL || "",
            createdAt: new Date(),
          };
          await setDoc(userRef, data);
        }
        // إضافة uid إلى الكائن
        data.uid = firebaseUser.uid;
        setUserData(data);
        setUser(firebaseUser);
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // دالة لتحديث بيانات المستخدم في الـ state و Firestore
  const updateUserData = async (updates) => {
    if (!user) return;
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

  const value = { user, userData, loading, updateUserData };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);