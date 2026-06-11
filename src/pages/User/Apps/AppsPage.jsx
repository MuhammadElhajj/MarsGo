// src/pages/User/Apps/AppsPage.jsx
import { lazy, Suspense, useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { useAppStore } from "../../../store/store";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../../firebase";
import CatalogList from "../../../components/Generic/CatalogList/CatalogList";
import GoBackButton from "../../../components/GeneralComponents/GoBackButton/GoBackButton";
import Loading from "../../../components/GeneralComponents/Loading/Loading";
import UnifiedCheckout from "../../../components/Generic/UnifiedCheckout/UnifiedCheckout";

const AppPackages = lazy(() => import("../../../components/UserComponents/App/AppPackages/AppPackages"));

export default function AppsPage() {
  const navigate = useNavigate();
  const apps = useAppStore((state) => state.apps);
  const setApps = useAppStore((state) => state.setApps);
  const [loading, setLoading] = useState(!apps || apps.length === 0);

  useEffect(() => {
    const fetchApps = async () => {
      if (apps && apps.length > 0) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const q = query(collection(db, 'apps'), orderBy('order', 'asc'));
        const snapshot = await getDocs(q);
        const appsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setApps(appsList);
      } catch (err) {
        console.error('خطأ في جلب التطبيقات:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, [apps, setApps]);

  const handleAppClick = (app) => {
    navigate(`/apps/app/${app.id}`);
  };

  if (loading) return <Loading text="جاري تحميل التطبيقات..." />;

  return (
    <Routes>
      <Route
        index
        element={
          <CatalogList
            items={apps}
            onItemClick={handleAppClick}
            title="اختر التطبيق"
            showBackButton={true}
            backButtonText="رجوع إلى لوحة التحكم"
            type="app"
          />
        }
      />
      <Route
        path="app/:appId"
        element={
          <Suspense fallback={<Loading text="جاري تحميل الباقات..." />}>
            <AppPackages />
          </Suspense>
        }
      />
      <Route
        path="checkout"
        element={
          <Suspense fallback={<Loading text="جاري تحميل صفحة الدفع..." />}>
            <UnifiedCheckout serviceType="apps" redirectPath="/apps" />
          </Suspense>
        }
      />
    </Routes>
  );
}