// src/App.jsx
import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuth } from "./context/AuthContext";
import Layout from "./layouts/UserLayout/Layout";
import AdminLayout from "./layouts/AdminLayout/AdminLayout";
import VerifierLayout from "./layouts/VerifierLayout/VerifierLayout";
import Loading from "./components/GeneralComponents/Loading/Loading";

// ==================== صفحات العميل ====================
const Login = lazy(() => import("./pages/User/Login/Login"));
const Dashboard = lazy(() => import("./pages/User/Dashboard/Dashboard"));
const TransferPage = lazy(() => import("./pages/User/Transfer/TransferPage"));
const CryptoPage = lazy(() => import("./pages/User/Crypto/CryptoPage"));
const ExchangePage = lazy(() => import("./pages/User/Exchange/ExchangePage"));
const AboutPage = lazy(() => import("./pages/User/About/AboutPage"));
const MyOrdersPage = lazy(() => import("./pages/User/MyOrders/MyOrdersPage"));
const NotificationsPage = lazy(() => import("./pages/User/Notifications/NotificationsPage"));
const ProfilePage = lazy(() => import("./components/UserComponents/Profile/ProfilePage"));
const AppsPage = lazy(() => import("./pages/User/Apps/AppsPage"));
const GamingPage = lazy(() => import("./pages/User/Gaming/GamingPage"));
const TopUpPage = lazy(() => import("./pages/User/TopUp/TopUpPage"));

// ==================== صفحات المدير (Admin) ====================
const AdminDashboard = lazy(() => import("./pages/Admin/AdminDashboard"));
const AdminOrdersPage = lazy(() => import("./pages/Admin/AdminOrders"));
const AdminUsersPage = lazy(() => import("./pages/Admin/AdminUsers"));
const AdManagementPage = lazy(() => import("./pages/Admin/AdManagementPage"));
const AdminGamesPage = lazy(() => import("./pages/Admin/AdminGames"));
const AdminNavLinksPage = lazy(() => import("./pages/Admin/AdminNavLinks"));
const AdminPageInstructions = lazy(() => import("./components/AdminCoponent/AdminPageInstructions/AdminPageInstructions"));
const AdminExchangeRate = lazy(() => import("./pages/Admin/AdminExchangeRate"));
const AdminStoreSettingsPage = lazy(() => import("./pages/Admin/AdminStoreSettingsPage"));
const AdminServicesPage = lazy(() => import("./pages/Admin/AdminServicesPage"));
const AdminTicker = lazy(() => import("./pages/Admin/AdminTicker"));
const AdminApps = lazy(() => import("./pages/Admin/AdminApps"));
import AdminVerifiers from "./components/AdminCoponent/AdminVerifiers/AdminVerifiers";
const AdminTopUpSettings = lazy(() => import('./pages/Admin/AdminTopUpSettings/AdminTopUpSettings'));
const AdminDiscountSettings = lazy(() => import('./pages/Admin/AdminDiscountSettings/AdminDiscountSettings'));
// ==================== صفحات المدقق (Verifier) ====================
const VerifierDashboard = lazy(() => import("./pages/Verifier/VerifierDashboard"));
const VerifierOrdersPage = lazy(() => import("./pages/Verifier/VerifierOrders"));
const ArchiveOrders = lazy(() => import("./components/VerifierComponents/ArchiveOrders/ArchiveOrders"));
// ... الاستيرادات الموجودة
const AdminMerchantSettings = lazy(() => import('./pages/Admin/AdminMerchantSettings/AdminMerchantSettings'));
// ==================== صفحة المدقق المالي ====================
const FinanceTopUpRequests = lazy(() => import("./pages/FinanceVerifier/FinanceTopUpRequests"));

function App() {
  const { user, userData, loading, emailVerified } = useAuth();

  if (loading) return <Loading />;

  return (
    <Suspense fallback={<Loading />}>
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--color-bg-secondary)',
            color: 'var(--color-text-primary)',
            borderRadius: 'var(--radius-md)',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: 'white' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: 'white' },
          },
        }}
      />
      <Routes>
        {/* صفحة تسجيل الدخول */}
        <Route
          path="/login"
          element={(!user || (user && !emailVerified)) ? <Login /> : <Navigate to="/dashboard" />}
        />

        {/* مسارات العميل */}
        <Route element={(user && emailVerified) ? <Layout /> : <Navigate to="/login" />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/apps/*" element={<AppsPage />} />
          <Route path="/transfer" element={<TransferPage />} />
          <Route path="/gaming/*" element={<GamingPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/crypto" element={<CryptoPage />} />
          <Route path="/exchange" element={<ExchangePage />} />
          <Route path="/my-orders" element={<MyOrdersPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/topup" element={<TopUpPage />} /> {/* ✅ تصحيح المسار */}
        </Route>

        {/* مسارات المدير */}
        <Route
          path="/admin"
          element={(user && emailVerified && userData?.role === 'admin') ? <AdminLayout /> : <Navigate to="/dashboard" />}
        >
          <Route index element={<AdminDashboard />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="games" element={<AdminGamesPage />} />
          <Route path="services" element={<AdminServicesPage />} />
          <Route path="store-settings" element={<AdminStoreSettingsPage />} />
          <Route path="ticker" element={<AdminTicker />} />
          <Route path="apps" element={<AdminApps />} />
          <Route path="verifiers" element={<AdminVerifiers />} />
          <Route path="page-instructions" element={<AdminPageInstructions />} />
          <Route path="exchange-rate" element={<AdminExchangeRate />} />
        
        <Route path="discounts" element={<AdminDiscountSettings />} />
<Route path="merchant-settings" element={<AdminMerchantSettings />} />  <Route path="ads" element={<AdManagementPage />} />
        <Route path="navigation" element={<AdminNavLinksPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          {/* ✅ مسار إعدادات الإيداع - تم تصحيح المسار وإزالة المسافات */}
          <Route path="topup-settings" element={<AdminTopUpSettings />} />
        </Route>

        {/* مسارات المدقق العادي */}
        <Route
          path="/verifier"
          element={(user && emailVerified && userData?.role === 'verifier') ? <VerifierLayout /> : <Navigate to="/dashboard" />}
        >
          <Route path="archive" element={<ArchiveOrders />} />
          <Route index element={<VerifierDashboard />} />
          <Route path="orders" element={<VerifierOrdersPage />} />
        </Route>

        {/* مسار المدقق المالي */}
        <Route
          path="/finance-verifier"
          element={
            (user && emailVerified && userData?.role === 'finance_verifier') ? (
              <Suspense fallback={<Loading text="جاري تحميل لوحة التدقيق المالي..." />}>
                <FinanceTopUpRequests />
              </Suspense>
            ) : (
              <Navigate to="/dashboard" />
            )
          }
        />

        {/* أي مسار غير معروف */}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Suspense>
  );
}

export default App;