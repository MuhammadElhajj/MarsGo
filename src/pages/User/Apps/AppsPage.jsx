// src/pages/User/Apps/AppsPage.jsx
import { lazy, Suspense } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { useApps } from "../../../context/AppsContext";
import ItemsGrid from "../../../components/Generic/ItemsGrid/ItemsGrid";
import GoBackButton from "../../../components/GeneralComponents/GoBackButton/GoBackButton";
import Loading from "../../../components/GeneralComponents/Loading/Loading";
import UnifiedCheckout from "../../../components/Generic/UnifiedCheckout/UnifiedCheckout";

const AppPackages = lazy(() => import("../../../components/UserComponents/App/AppPackages/AppPackages"));

export default function AppsPage() {
  const { apps, loading } = useApps();
  const navigate = useNavigate();

  const handleAppClick = (app) => {
    navigate(`/apps/app/${app.id}`);
  };

  if (loading) return <Loading text="جاري تحميل التطبيقات..." />;

  return (
    <Routes>
      <Route
        index
        element={
          <ItemsGrid
            items={apps}
            onItemClick={handleAppClick}
            title="اختر التطبيق"
            backButton={<GoBackButton text="رجوع إلى لوحة التحكم" />}
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