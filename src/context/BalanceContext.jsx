// src/contexts/BalanceContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const BalanceContext = createContext();

export function useBalance() {
  return useContext(BalanceContext);
}

export function BalanceProvider({ children }) {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setBalance(0);
      setLoading(false);
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setBalance(data.balance || 0);
      } else {
        setBalance(0);
      }
      setLoading(false);
    }, (error) => {
      console.error('خطأ في جلب الرصيد:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const deductBalance = async (amountUSD) => {
    if (!user) return false;
    if (balance < amountUSD) {
      toast.error('رصيد غير كافٍ، يرجى شحن الرصيد أولاً');
      return false;
    }
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        balance: increment(-amountUSD)
      });
      toast.success(`تم خصم ${amountUSD.toFixed(2)} $ من رصيدك`);
      return true;
    } catch (error) {
      console.error('فشل الخصم:', error);
      toast.error('حدث خطأ أثناء خصم الرصيد');
      return false;
    }
  };

  const addBalance = async (userId, amountUSD) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        balance: increment(amountUSD)
      });
      return true;
    } catch (error) {
      console.error('فشل إضافة الرصيد:', error);
      return false;
    }
  };

  return (
    <BalanceContext.Provider value={{ balance, loading, deductBalance, addBalance }}>
      {children}
    </BalanceContext.Provider>
  );
}