// src/components/AdminCoponent/ExternalStoreImport/hooks/useProducts.js
import { useState, useCallback } from 'react';
import { fetchStoreProducts } from '../../../../services/apiStoreService';
import { showToast } from '../../../GeneralComponents/ToastNotification/ToastNotification';

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchStoreProducts();
      setProducts(data);
    } catch (err) {
      showToast('فشل تحميل المنتجات', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { products, loading, loadProducts };
}