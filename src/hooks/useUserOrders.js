// src/hooks/useUserOrders.js
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function useUserOrders(orderType) {
  const { userData } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userData?.uid) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'orders'),
          where('userId', '==', userData.uid),
          where('type', '==', orderType)
        );
        const snapshot = await getDocs(q);
        let ordersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // ترتيب تنازلي حسب createdAt
        ordersList.sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
          return dateB - dateA;
        });
        setOrders(ordersList);
      } catch (err) {
        console.error(`خطأ في جلب طلبات ${orderType}:`, err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [userData?.uid, orderType]);

  return { orders, loading, error };
}