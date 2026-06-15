// src/hooks/useCategoryMappings.js
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function useCategoryMappings() {
  const [mappings, setMappings] = useState(null);
  const [hierarchicalConfig, setHierarchicalConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const mappingsDoc = await getDoc(doc(db, 'config', 'categoryMappings'));
        const hierarchicalDoc = await getDoc(doc(db, 'config', 'hierarchicalConfig'));
        setMappings(mappingsDoc.exists() ? mappingsDoc.data() : {});
        setHierarchicalConfig(
          hierarchicalDoc.exists()
            ? hierarchicalDoc.data()
            : { games: { separator: ' - ' }, apps: { separator: ' - ' } }
        );
      } catch (err) {
        console.error('فشل جلب إعدادات التصنيف:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  return { mappings, hierarchicalConfig, loading };
}