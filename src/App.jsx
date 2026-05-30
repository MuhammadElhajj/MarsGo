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
const GamingPage = lazy(() => import("./pages/User/Gaming/GamingPage"));
const CryptoPage = lazy(() => import("./pages/User/Crypto/CryptoPage"));
const ExchangePage = lazy(() => import("./pages/User/Exchange/ExchangePage"));
const AboutPage = lazy(() => import("./pages/User/About/AboutPage"));
const PaymentInfoPage  = lazy(() => import("./pages/User/PaymentPage/PaymentPage"));

// صفحات المدير
const AdminDashboard = lazy(() => import("./pages/Admin/AdminDashboard"));
const AdminOrdersPage = lazy(() => import("./pages/Admin/AdminOrders"));
const AdminUsersPage = lazy(() => import("./pages/Admin/AdminUsers"));
const AdManagementPage = lazy(() => import("./pages/Admin/AdManagementPage"));
import AdminPaymentSettingsPage from './pages/Admin/AdminPaymentSettingsPage';
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
        <Route
          element={user ? <Layout /> : <Navigate to="/login" />}
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/transfer" element={<TransferPage />} />
          <Route path="/gaming" element={<GamingPage />} />
          <Route path="/crypto" element={<CryptoPage />} />
          <Route path="/exchange" element={<ExchangePage />} />
         
         <Route path="/payment-info" element={<PaymentInfoPage />} /> <Route path="/about" element={<AboutPage />} />
        </Route>

        {/* مسارات المدير */}
        <Route
          path="/admin"
          element={userData?.role === 'admin' ? <AdminLayout /> : <Navigate to="/dashboard" />}
        >
          <Route index element={<AdminDashboard />} />
          <Route path="orders" element={<AdminOrdersPage />} />
       
       <Route path="/admin/payment-settings" element={<AdminPaymentSettingsPage />} />   <Route path="ads" element={<AdManagementPage />} />
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