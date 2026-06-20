// src/components/AdminCoponent/ExternalStoreImport/hooks/useParentItems.js
import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../../../firebase';
import { showToast } from '../../../GeneralComponents/ToastNotification/ToastNotification';

export function useParentItems(categoryId) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadItems = useCallback(async () => {
    if (categoryId !== 'games' && categoryId !== 'apps') {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const q = query(collection(db, categoryId), orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      const itemsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // جلب عدد الباقات لكل عنصر
      const counts = {};
      for (const item of itemsList) {
        const packagesRef = collection(db, categoryId, item.id, 'packages');
        const packagesSnap = await getDocs(packagesRef);
        counts[item.id] = packagesSnap.size;
      }

      const result = itemsList.map(item => ({
        ...item,
        packageCount: counts[item.id] || 0,
      }));
      setItems(result);
    } catch (err) {
      console.error(err);
      showToast('فشل تحميل الألعاب/التطبيقات', 'error');
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  return { items, loading, refetch: loadItems };
}