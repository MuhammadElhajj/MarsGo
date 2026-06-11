// src/components/StoreInitializer.jsx
import { useEffect } from 'react';
import { useAppStore } from '../../../store/store';
import { useAuth } from '../../../context/AuthContext';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../../../firebase';

export default function StoreInitializer({ children }) {
  const { user } = useAuth();
  const { 
    setUser, 
    setUserData, 
    setBalance, 
    setExchangeRate, 
    setUnreadCount,
    setCurrency,
    setIsDark
  } = useAppStore();

  // مزامنة المستخدم
  useEffect(() => {
    setUser(user);
    if (!user) {
      setUserData(null);
      return;
    }
    const unsubUser = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) setUserData(docSnap.data());
    });
    return () => unsubUser();
  }, [user, setUser, setUserData]);

  // مزامنة الرصيد
  useEffect(() => {
    if (!user) return;
    const unsubBalance = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) setBalance(docSnap.data().balance || 0);
    });
    return () => unsubBalance();
  }, [user, setBalance]);

  // مزامنة سعر الصرف
  useEffect(() => {
    const unsubRate = onSnapshot(doc(db, 'exchangeRate', 'default'), (docSnap) => {
      if (docSnap.exists()) setExchangeRate(docSnap.data().value || 15000);
    });
    return () => unsubRate();
  }, [setExchangeRate]);

  // مزامنة إعدادات العملة والثيم من localStorage (إذا وجدت)
  useEffect(() => {
    const savedCurrency = localStorage.getItem('preferredCurrency');
    if (savedCurrency === 'SYP') setCurrency('SYP');
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') setIsDark(true);
  }, [setCurrency, setIsDark]);

  return children;
}