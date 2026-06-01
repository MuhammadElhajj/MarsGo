import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./layouts/UserLayout/Layout";
import AdminLayout from "./layouts/AdminLayout/AdminLayout"
import VerifierLayout from "./layouts/VerifierLayout/VerifierLayout";
import Loading from "./components/GeneralComponents/Loading/Loading";

const Login = lazy(() => import("./pages/User/Login/Login"));
const Dashboard = lazy(() => import("./pages/User/Dashboard/Dashboard"));
const TransferPage = lazy(() => import("./pages/User/Transfer/TransferPage"));
// تم حذف GamingPage القديم
const CryptoPage = lazy(() => import("./pages/User/Crypto/CryptoPage"));
const ExchangePage = lazy(() => import("./pages/User/Exchange/ExchangePage"));
const AboutPage = lazy(() => import("./pages/User/About/AboutPage"));
const PaymentInfoPage  = lazy(() => import("./pages/User/PaymentPage/PaymentPage"));
const MyOrdersPage = lazy(() => import('./pages/User/MyOrders/MyOrdersPage'));
// صفحات المدير
const AdminDashboard = lazy(() => import("./pages/Admin/AdminDashboard"));
const AdminOrdersPage = lazy(() => import("./pages/Admin/AdminOrders"));
const AdminUsersPage = lazy(() => import("./pages/Admin/AdminUsers"));
const AdManagementPage = lazy(() => import("./pages/Admin/AdManagementPage"));
const AdminGamesPage = lazy(() => import("./pages/Admin/AdminGames"));
import AdminPaymentSettingsPage from './pages/Admin/AdminPaymentSettingsPage';
const AdminNavLinksPage = lazy(() => import("./pages/Admin/AdminNavLinks"));
const AdminPageInstructions = lazy(() => import('./components/AdminCoponent/AdminPageInstructions/AdminPageInstructions'));
// الصفحات الجديدة لنظام شحن الألعاب (متعددة الصفحات)
const GamesList = lazy(() => import('./pages/User/Gaming/GamesList'));
const PackagesList = lazy(() => import('./pages/User/Gaming/PackagesList'));
const CheckoutPage = lazy(() => import('./pages/User/Gaming/CheckoutPage'));

const AdminStoreSettingsPage = lazy(() => import("./pages/Admin/AdminStoreSettingsPage"));
const AdminServicesPage = lazy(() => import("./pages/Admin/AdminServicesPage"));

// صفحات المدقق
const VerifierDashboard = lazy(() => import("./pages/Verifier/VerifierDashboard"));
const VerifierOrdersPage = lazy(() => import("./pages/Verifier/VerifierOrders"));

function App() {
  const { user, userData, loading } = useAuth();

  if (loading) return <Loading />;

  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route
          path="/login"
          element={!user ? <Login /> : <Navigate to="/dashboard" />}
        />

        {/* مسارات العميل */}
        <Route element={user ? <Layout /> : <Navigate to="/login" />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/transfer" element={<TransferPage />} />
          {/* تم استبدال مسار gaming القديم بالمسارات الجديدة */}
          <Route path="/gaming" element={<GamesList />} />
          <Route path="/gaming/game/:gameId" element={<PackagesList />} />
          <Route path="/gaming/checkout/:gameId/:packageId" element={<CheckoutPage />} />
          <Route path="/crypto" element={<CryptoPage />} />
          <Route path="/exchange" element={<ExchangePage />} />
          <Route path="/payment-info" element={<PaymentInfoPage />} />
        <Route path="/my-orders" element={<MyOrdersPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Route>

        {/* مسارات المدير */}
        <Route
          path="/admin"
          element={userData?.role === 'admin' ? <AdminLayout /> : <Navigate to="/dashboard" />}
        >
          <Route index element={<AdminDashboard />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="games" element={<AdminGamesPage />} />
          <Route path="services" element={<AdminServicesPage />} />
          <Route path="store-settings" element={<AdminStoreSettingsPage />} />
          
          <Route path="page-instructions" element={<AdminPageInstructions />} /><Route path="/admin/payment-settings" element={<AdminPaymentSettingsPage />} />
          <Route path="ads" element={<AdManagementPage />} />
          <Route path="navigation" element={<AdminNavLinksPage />} />
          <Route path="users" element={<AdminUsersPage />} />
        </Route>

        {/* مسارات المدقق */}
        <Route
          path="/verifier"
          element={userData?.role === 'verifier' ? <VerifierLayout /> : <Navigate to="/dashboard" />}
        >
          <Route index element={<VerifierDashboard />} />
          <Route path="orders" element={<VerifierOrdersPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Suspense>
  );
}

export default App;