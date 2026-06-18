import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuth } from "./context/AuthContext";
import { useAppStore } from "./store/store";
import Layout from "./layouts/UserLayout/Layout";
import AdminLayout from "./layouts/AdminLayout/AdminLayout";
import VerifierLayout from "./layouts/VerifierLayout/VerifierLayout";
import Loading from "./components/GeneralComponents/Loading/Loading";
import AdminCategories from './components/AdminCoponent/AdminCategories/AdminCategories';
// ==================== صفحات المستخدم ====================
const SearchUserPage = lazy(() => import('./pages/User/SearchUserPage/SearchUserPage'));
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
const ForgotPasswordPage = lazy(() => import("./pages/User/ForgotPassword/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/User/ResetPassword/ResetPasswordPage"));
const VerifyCodePage = lazy(() => import("./pages/User/VerifyCode/VerifyCodePage"));
const CatalogPage = lazy(() => import("./pages/User/Catalog/CatalogPage"));
const CategoryProductsPage = lazy(() => import("./pages/User/CategoryProductsPage/CategoryProductsPage"));
const GamePackagesPage = lazy(() => import("./pages/User/GamePackagesPage/GamePackagesPage"));
import BuyMGC from './pages/User/BuyMGC/BuyMGC';
const PrivacyPolicy = lazy(() => import("./pages/User/PrivacyPolicy/PrivacyPolicy"));
import WheelPage from './components/UserComponents/WheelPage/WheelPage';
import ChatPage from './components/UserComponents/Chat/ChatPage';
import ChatRoom from './components/UserComponents/Chat/ChatRoom';
const PublicProfilePage = lazy(() => import('./components/UserComponents/PublicProfile/PublicProfilePage'));
const FriendsPage  = lazy(() => import('./pages/User/FriendsPage/FriendsPage'));
// import  PublicProfilePage from'./components/UserComponents/PublicProfile/PublicProfilePage';
const MyActivitiesPage = lazy(() => import('./pages/User/MyActivities/MyActivitiesPage'));
// ==================== صفحات المدير (Admin) ====================
import LeaderboardPage from './pages/User/LeaderboardPage/LeaderboardPage';
const AdminDashboard = lazy(() => import("./pages/Admin/AdminDashboard"));
const AdminOrdersPage = lazy(() => import("./pages/Admin/AdminOrders"));
const AdminUsersPage = lazy(() => import("./pages/Admin/AdminUsers"));
const AdManagementPage = lazy(() => import("./pages/Admin/AdManagementPage"));
const AdminNavLinksPage = lazy(() => import("./pages/Admin/AdminNavLinks"));
const AdminPageInstructions = lazy(() => import("./components/AdminCoponent/AdminPageInstructions/AdminPageInstructions"));
const AdminExchangeRate = lazy(() => import("./pages/Admin/AdminExchangeRate"));
const AdminStoreSettingsPage = lazy(() => import("./pages/Admin/AdminStoreSettingsPage"));
const AdminServicesPage = lazy(() => import("./pages/Admin/AdminServicesPage"));
const AdminTicker = lazy(() => import("./pages/Admin/AdminTicker"));
const AdminVerifiers = lazy(() => import("./components/AdminCoponent/AdminVerifiers/AdminVerifiers"));
const ExternalStoreImport = lazy(() => import("./pages/Admin/ExternalStoreImport/ExternalStoreImport"));
const AdminTopUpSettings = lazy(() => import("./pages/Admin/AdminTopUpSettings/AdminTopUpSettings"));
const AdminDiscountSettings = lazy(() => import("./pages/Admin/AdminDiscountSettings/AdminDiscountSettings"));
const AdminMerchantSettings = lazy(() => import("./pages/Admin/AdminMerchantSettings/AdminMerchantSettings"));
const AdminUnifiedCatalog = lazy(() => import("./pages/Admin/AdminUnifiedCatalog/AdminUnifiedCatalog"));
const ContentManager = lazy(() => import("./components/AdminCoponent/ContentManager/ContentManager"));

// ==================== صفحات المدقق (Verifier) ====================
const VerifierDashboard = lazy(() => import("./pages/Verifier/VerifierDashboard"));
const VerifierOrdersPage = lazy(() => import("./pages/Verifier/VerifierOrders"));
const ArchiveOrders = lazy(() => import("./components/VerifierComponents/ArchiveOrders/ArchiveOrders"));

// ==================== صفحة المدقق المالي ====================
const FinanceTopUpRequests = lazy(() => import("./pages/FinanceVerifier/FinanceTopUpRequests"));

function App() {
  const fetchProducts = useAppStore((state) => state.fetchProducts);
  const { user, userData, loading, emailVerified } = useAuth();
  const listenToBalance = useAppStore((state) => state.listenToBalance);

  useEffect(() => {
    fetchProducts();
    if (user?.uid) {
      const unsubscribe = listenToBalance(user.uid);
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [user, listenToBalance]);

  useEffect(() => {
    const unsubscribeRate = useAppStore.getState().listenToExchangeRate?.();
    return () => { if (unsubscribeRate) unsubscribeRate(); };
  }, []);

  useEffect(() => {
    const unsubscribeRate = useAppStore.getState().listenToExchangeRate?.();
    const unsubscribeTopUp = useAppStore.getState().listenToTopUpSettings?.();
    return () => {
      if (unsubscribeRate) unsubscribeRate();
      if (unsubscribeTopUp) unsubscribeTopUp();
    };
  }, []);

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

        {/* صفحة إدخال كود التفعيل */}
        <Route path="/verify-code" element={<VerifyCodePage />} />

        {/* صفحتي استعادة كلمة المرور (بدون مصادقة) */}
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* مسارات العميل (تتطلب مصادقة + تفعيل) */}
        <Route element={(user && emailVerified) ? <Layout /> : <Navigate to="/login" />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/apps/*" element={<AppsPage />} />
          <Route path="/transfer" element={<TransferPage />} />
          <Route path="/gaming/*" element={<GamingPage />} />
          <Route path="/chat/room/:roomId" element={<ChatRoom />} />
          <Route path="/wheel" element={<WheelPage />} />
    
    <Route path="/my-activities" element={<MyActivitiesPage />} />      <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:userId" element={<PublicProfilePage />} />
          <Route path="/crypto" element={<CryptoPage />} />
          <Route path="/exchange" element={<ExchangePage />} />
       <Route path="/search-user" element={<SearchUserPage />} />
       <Route path="/buy-mgc" element={<BuyMGC />} />
   <Route path="/my-orders" element={<MyOrdersPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/about" element={<AboutPage />} />
        
        <Route path="/friends" element={<FriendsPage />} />  <Route path="/chat" element={<ChatPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/topup" element={<TopUpPage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/category/:categoryId" element={<CategoryProductsPage />} />
          <Route path="/category/:categoryId/:gameName" element={<CategoryProductsPage />} />
        </Route>

        {/* مسارات المدير */}
        <Route
          path="/admin"
          element={(user && emailVerified && userData?.role === 'admin') ? <AdminLayout /> : <Navigate to="/dashboard" />}
        >
          <Route index element={<AdminDashboard />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="services" element={<AdminServicesPage />} />
          <Route path="store-settings" element={<AdminStoreSettingsPage />} />
          <Route path="catalog" element={<AdminUnifiedCatalog />} />
          <Route path="external-store-import" element={<ExternalStoreImport />} />
          <Route path="content/:type/:itemId" element={<ContentManager />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
          <Route path="ticker" element={<AdminTicker />} />
          <Route path="verifiers" element={<AdminVerifiers />} />
          <Route path="page-instructions" element={<AdminPageInstructions />} />
          <Route path="exchange-rate" element={<AdminExchangeRate />} />
          <Route path="discounts" element={<AdminDiscountSettings />} />
          <Route path="merchant-settings" element={<AdminMerchantSettings />} />
          <Route path="ads" element={<AdManagementPage />} />
          <Route path="navigation" element={<AdminNavLinksPage />} />
          <Route path="users" element={<AdminUsersPage />} />
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