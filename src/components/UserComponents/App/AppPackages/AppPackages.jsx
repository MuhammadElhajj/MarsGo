// src/components/UserComponents/App/AppPackages/AppPackages.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../../../store/store';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../../../firebase';
import CatalogList from '../../../Generic/CatalogList/CatalogList';

export default function AppPackages() {
  const { appId } = useParams();
  const navigate = useNavigate();
  const apps = useAppStore((state) => state.apps);
  const [app, setApp] = useState(null);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!appId) return;
      // البحث عن التطبيق في الـ store (تم جلبها مسبقاً في AppsPage)
      const foundApp = apps?.find(a => a.id === appId);
      setApp(foundApp || null);

      // جلب الباقات من Firestore
      try {
        const q = query(collection(db, 'apps', appId, 'packages'), orderBy('order', 'asc'));
        const snapshot = await getDocs(q);
        const pkgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPackages(pkgs);
      } catch (err) {
        console.error('خطأ في جلب باقات التطبيق:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [appId, apps]);

  const handlePackageSelect = (pkg) => {
    navigate('/apps/checkout', { state: { item: app, package: pkg } });
  };

  if (loading) return <div>جاري التحميل...</div>;
  if (!app) return <div>التطبيق غير موجود</div>;

  return (
    <CatalogList
      items={packages}
      onItemClick={handlePackageSelect}
      title={`باقات ${app.name}`}
      showBackButton={true}
      showPrice={true}
      type="package"
      parentId={app.id}
      parentType="app"
    />
  );
}