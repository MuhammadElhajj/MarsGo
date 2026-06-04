// import { lazy, Suspense } from "react";
// import { Routes, Route, Navigate } from "react-router-dom";
// import { Toaster } from "react-hot-toast"; // ✅ إضافة Toaster للإشعارات
// import { useAuth } from "./context/AuthContext";
// import Layout from "./layouts/UserLayout/Layout";
// import AdminLayout from "./layouts/AdminLayout/AdminLayout"
// import VerifierLayout from "./layouts/VerifierLayout/VerifierLayout";
// import Loading from "./components/GeneralComponents/Loading/Loading";

// const Login = lazy(() => import("./pages/User/Login/Login"));
// const Dashboard = lazy(() => import("./pages/User/Dashboard/Dashboard"));
// const TransferPage = lazy(() => import("./pages/User/Transfer/TransferPage"));
// // تم حذف GamingPage القديم
// const CryptoPage = lazy(() => import("./pages/User/Crypto/CryptoPage"));
// const ExchangePage = lazy(() => import("./pages/User/Exchange/ExchangePage"));
// const AboutPage = lazy(() => import("./pages/User/About/AboutPage"));
// const PaymentInfoPage  = lazy(() => import("./pages/User/PaymentPage/PaymentPage"));
// const MyOrdersPage = lazy(() => import('./pages/User/MyOrders/MyOrdersPage'));
// const NotificationsPage = lazy(() => import("./pages/User/Notifications/NotificationsPage"));
// const AppsPage = lazy(() => import("./pages/User/Apps/AppsPage"));
// // صفحات المدير
// const AdminDashboard = lazy(() => import("./pages/Admin/AdminDashboard"));
// const AdminOrdersPage = lazy(() => import("./pages/Admin/AdminOrders"));
// const AdminUsersPage = lazy(() => import("./pages/Admin/AdminUsers"));
// const AdManagementPage = lazy(() => import("./pages/Admin/AdManagementPage"));
// const AdminGamesPage = lazy(() => import("./pages/Admin/AdminGames"));
// import AdminPaymentSettingsPage from './pages/Admin/AdminPaymentSettingsPage';
// const AdminNavLinksPage = lazy(() => import("./pages/Admin/AdminNavLinks"));
// const AdminPageInstructions = lazy(() => import('./components/AdminCoponent/AdminPageInstructions/AdminPageInstructions'));
// import AdminVerifiers from "./components/AdminCoponent/AdminVerifiers/AdminVerifiers";
// const GamingPage = lazy(() => import('./pages/User/Gaming/GamingPage'));
// const AdminExchangeRate = lazy(() => import('./pages/Admin/AdminExchangeRate'));
// const AdminStoreSettingsPage = lazy(() => import("./pages/Admin/AdminStoreSettingsPage"));
// const AdminServicesPage = lazy(() => import("./pages/Admin/AdminServicesPage"));
// const AdminTicker = lazy(() => import('./pages/Admin/AdminTicker'));
// const AdminApps = lazy(() => import("./pages/Admin/AdminApps"));
// // صفحات المدقق
// const VerifierDashboard = lazy(() => import("./pages/Verifier/VerifierDashboard"));
// const VerifierOrdersPage = lazy(() => import("./pages/Verifier/VerifierOrders"));
// const ArchiveOrders = lazy(() => import("./components/VerifierComponents/ArchiveOrders/ArchiveOrders"));
// function App() {
//   const { user, userData, loading } = useAuth();

//   if (loading) return <Loading />;

//   return (
//     <Suspense fallback={<Loading />}>
//       <Toaster
//         position="top-center"
//         reverseOrder={false}
//         toastOptions={{
//           duration: 3000,
//           style: {
//             background: 'var(--color-bg-secondary)',
//             color: 'var(--color-text-primary)',
//             borderRadius: 'var(--radius-md)',
//           },
//           success: {
//             iconTheme: {
//               primary: '#10b981',
//               secondary: 'white',
//             },
//           },
//           error: {
//             iconTheme: {
//               primary: '#ef4444',
//               secondary: 'white',
//             },
//           },
//         }}
//       />
//       <Routes>
//         <Route
//           path="/login"
//           element={!user ? <Login /> : <Navigate to="/dashboard" />}
//         />

//         {/* مسارات العميل */}
//         <Route element={user ? <Layout /> : <Navigate to="/login" />}>
//           <Route path="/dashboard" element={<Dashboard />} />
          
//           <Route path="/apps/*" element={<AppsPage />} />   {/* ✅ استدعاء واحد فقط */}<Route path="/transfer" element={<TransferPage />} />
//           {/* تم استبدال مسار gaming القديم بالمسارات الجديدة */}
//  <Route path="/gaming/*" element={<GamingPage />} />
//           <Route path="/crypto" element={<CryptoPage />} />
//           <Route path="/exchange" element={<ExchangePage />} />
//           <Route path="/payment-info" element={<PaymentInfoPage />} />
//         <Route path="/my-orders" element={<MyOrdersPage />} />
//        <Route path="/notifications" element={<NotificationsPage />} />
//           <Route path="/about" element={<AboutPage />} />
//         </Route>

//         {/* مسارات المدير */}
//         <Route
//           path="/admin"
//           element={userData?.role === 'admin' ? <AdminLayout /> : <Navigate to="/dashboard" />}
//         >
//           <Route index element={<AdminDashboard />} />
//           <Route path="orders" element={<AdminOrdersPage />} />
//           <Route path="games" element={<AdminGamesPage />} />
//           <Route path="services" element={<AdminServicesPage />} />
//           <Route path="store-settings" element={<AdminStoreSettingsPage />} />
//          <Route path="ticker" element={<AdminTicker />} />
//          <Route path="apps" element={<AdminApps />} />
//           <Route path="verifiers" element={<AdminVerifiers />} />
//           <Route path="page-instructions" element={<AdminPageInstructions />} /><Route path="/admin/payment-settings" element={<AdminPaymentSettingsPage />} />
         
//          <Route path="exchange-rate" element={<AdminExchangeRate />} /> <Route path="ads" element={<AdManagementPage />} />
//           <Route path="navigation" element={<AdminNavLinksPage />} />
//           <Route path="users" element={<AdminUsersPage />} />
//         </Route>

//         {/* مسارات المدقق */}
//         <Route
//           path="/verifier"
//           element={userData?.role === 'verifier' ? <VerifierLayout /> : <Navigate to="/dashboard" />}
//         >
//           <Route path="archive" element={<ArchiveOrders />} />
//           <Route index element={<VerifierDashboard />} />
//           <Route path="orders" element={<VerifierOrdersPage />} />
//         </Route>

//         <Route path="*" element={<Navigate to="/dashboard" />} />
//       </Routes>
//     </Suspense>
//   );
// }

// export default App;

import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuth } from "./context/AuthContext";
import Layout from "./layouts/UserLayout/Layout";
import AdminLayout from "./layouts/AdminLayout/AdminLayout"
import VerifierLayout from "./layouts/VerifierLayout/VerifierLayout";
import Loading from "./components/GeneralComponents/Loading/Loading";

const Login = lazy(() => import("./pages/User/Login/Login"));
const Dashboard = lazy(() => import("./pages/User/Dashboard/Dashboard"));
const TransferPage = lazy(() => import("./pages/User/Transfer/TransferPage"));
const CryptoPage = lazy(() => import("./pages/User/Crypto/CryptoPage"));
const ExchangePage = lazy(() => import("./pages/User/Exchange/ExchangePage"));
const AboutPage = lazy(() => import("./pages/User/About/AboutPage"));
const PaymentInfoPage  = lazy(() => import("./pages/User/PaymentPage/PaymentPage"));
const MyOrdersPage = lazy(() => import('./pages/User/MyOrders/MyOrdersPage'));
const NotificationsPage = lazy(() => import("./pages/User/Notifications/NotificationsPage"));
const ProfilePage = lazy(() => import('./components/UserComponents/Profile/ProfilePage'));

// داخل Routes تحت Layout (بعد /about مثلاً)
<Route path="/profile" element={<ProfilePage />} />
const AppsPage = lazy(() => import("./pages/User/Apps/AppsPage"));
// صفحات المدير
const AdminDashboard = lazy(() => import("./pages/Admin/AdminDashboard"));
const AdminOrdersPage = lazy(() => import("./pages/Admin/AdminOrders"));
const AdminUsersPage = lazy(() => import("./pages/Admin/AdminUsers"));
const AdManagementPage = lazy(() => import("./pages/Admin/AdManagementPage"));
const AdminGamesPage = lazy(() => import("./pages/Admin/AdminGames"));
import AdminPaymentSettingsPage from './pages/Admin/AdminPaymentSettingsPage';
const AdminNavLinksPage = lazy(() => import("./pages/Admin/AdminNavLinks"));
const AdminPageInstructions = lazy(() => import('./components/AdminCoponent/AdminPageInstructions/AdminPageInstructions'));
import AdminVerifiers from "./components/AdminCoponent/AdminVerifiers/AdminVerifiers";
const GamingPage = lazy(() => import('./pages/User/Gaming/GamingPage'));
const AdminExchangeRate = lazy(() => import('./pages/Admin/AdminExchangeRate'));
const AdminStoreSettingsPage = lazy(() => import("./pages/Admin/AdminStoreSettingsPage"));
const AdminServicesPage = lazy(() => import("./pages/Admin/AdminServicesPage"));
const AdminTicker = lazy(() => import('./pages/Admin/AdminTicker'));
const AdminApps = lazy(() => import("./pages/Admin/AdminApps"));
// صفحات المدقق
const VerifierDashboard = lazy(() => import("./pages/Verifier/VerifierDashboard"));
const VerifierOrdersPage = lazy(() => import("./pages/Verifier/VerifierOrders"));
const ArchiveOrders = lazy(() => import("./components/VerifierComponents/ArchiveOrders/ArchiveOrders"));

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
            iconTheme: {
              primary: '#10b981',
              secondary: 'white',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: 'white',
            },
          },
        }}
      />
      <Routes>
        {/* صفحة تسجيل الدخول: تعرض إذا لم يكن المستخدم مسجلاً، 
            أو إذا كان مسجلاً لكن بريده غير مفعل (نعرض له رسالة) */}
        <Route
          path="/login"
          element={(!user || (user && !emailVerified)) ? <Login /> : <Navigate to="/dashboard" />}
        />

        {/* مسارات العميل - تتطلب تسجيل الدخول وتفعيل البريد الإلكتروني */}
        <Route element={(user && emailVerified) ? <Layout /> : <Navigate to="/login" />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/apps/*" element={<AppsPage />} />
          <Route path="/transfer" element={<TransferPage />} />
          <Route path="/gaming/*" element={<GamingPage />} />
        
        <Route path="/profile" element={<ProfilePage />} />  <Route path="/crypto" element={<CryptoPage />} />
          <Route path="/exchange" element={<ExchangePage />} />
          <Route path="/payment-info" element={<PaymentInfoPage />} />
          <Route path="/my-orders" element={<MyOrdersPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Route>

        {/* مسارات المدير - تتطلب دور admin وتفعيل البريد */}
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
          <Route path="/admin/payment-settings" element={<AdminPaymentSettingsPage />} />
          <Route path="exchange-rate" element={<AdminExchangeRate />} />
          <Route path="ads" element={<AdManagementPage />} />
          <Route path="navigation" element={<AdminNavLinksPage />} />
          <Route path="users" element={<AdminUsersPage />} />
        </Route>

        {/* مسارات المدقق - تتطلب دور verifier وتفعيل البريد */}
        <Route
          path="/verifier"
          element={(user && emailVerified && userData?.role === 'verifier') ? <VerifierLayout /> : <Navigate to="/dashboard" />}
        >
          <Route path="archive" element={<ArchiveOrders />} />
          <Route index element={<VerifierDashboard />} />
          <Route path="orders" element={<VerifierOrdersPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Suspense>
  );
}

export default App;