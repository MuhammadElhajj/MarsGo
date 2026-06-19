import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// ===== السياقات والمكتبات =====
import { useAuth } from "./context/AuthContext";
import { useAppStore } from "./store/store";

// ===== التخطيطات =====
import Layout from "./layouts/UserLayout/Layout";
import AdminLayout from "./layouts/AdminLayout/AdminLayout";
import VerifierLayout from "./layouts/VerifierLayout/VerifierLayout";

// ===== المكونات العامة =====
import Loading from "./components/GeneralComponents/Loading/Loading";
import AdminCategories from "./components/AdminCoponent/AdminCategories/AdminCategories";

// ============================================================
//  صفحات المستخدم (User Pages) – تحميل كسول
// ============================================================
const SellMGC = lazy(() => import("./pages/User/SellMGC/SellMGC"));
const SearchUserPage = lazy(() => import("./pages/User/SearchUserPage/SearchUserPage"));
const ReferralPage = lazy(() => import("./pages/User/ReferralPage/ReferralPage"));
const Login = lazy(() => import("./pages/User/Login/Login"));
const Dashboard = lazy(() => import("./pages/User/Dashboard/Dashboard"));
const TransferPage = lazy(() => import("./pages/User/Transfer/TransferPage"));
const CryptoPage = lazy(() => import("./pages/User/Crypto/CryptoPage"));
const ExchangePage = lazy(() => import("./pages/User/Exchange/ExchangePage"));
const AboutPage = lazy(() => import("./pages/User/About/AboutPage"));
const ReviewsPage = lazy(() => import("./pages/User/ReviewsPage/ReviewsPage"));
const MyOrdersPage = lazy(() => import("./pages/User/MyOrders/MyOrdersPage"));
const NotificationsPage = lazy(() => import("./pages/User/Notifications/NotificationsPage"));
const ProfilePage = lazy(() => import("./components/UserComponents/Profile/ProfilePage"));
const AppsPage = lazy(() => import("./pages/User/Apps/AppsPage"));
const GamingPage = lazy(() => import("./pages/User/Gaming/GamingPage"));
import SignupPage from "./pages/User/Login/SignupPage"; // سياق عادي (لا يمكن تعليقه لأن React Router يحتاجه فوراً)
const MissionsPage = lazy(() => import("./pages/User/MissionsPage/MissionsPage"));
const MembershipsPage = lazy(() => import("./pages/User/MembershipsPage/MembershipsPage"));
const TopUpPage = lazy(() => import("./pages/User/TopUp/TopUpPage"));
const ForgotPasswordPage = lazy(() => import("./pages/User/ForgotPassword/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/User/ResetPassword/ResetPasswordPage"));
const VerifyCodePage = lazy(() => import("./pages/User/VerifyCode/VerifyCodePage"));
const CatalogPage = lazy(() => import("./pages/User/Catalog/CatalogPage"));
const CategoryProductsPage = lazy(() => import("./pages/User/CategoryProductsPage/CategoryProductsPage"));
const GamePackagesPage = lazy(() => import("./pages/User/GamePackagesPage/GamePackagesPage"));
import BuyMGC from "./pages/User/BuyMGC/BuyMGC"; // سياق عادي (يمكن تغييره لـ lazy لاحقاً)
const PrivacyPolicy = lazy(() => import("./pages/User/PrivacyPolicy/PrivacyPolicy"));
import WheelPage from "./components/UserComponents/WheelPage/WheelPage"; // سياق عادي
import ChatPage from "./components/UserComponents/Chat/ChatPage"; // سياق عادي
import ChatRoom from "./components/UserComponents/Chat/ChatRoom"; // سياق عادي
const PublicProfilePage = lazy(() => import("./components/UserComponents/PublicProfile/PublicProfilePage"));
const FriendsPage = lazy(() => import("./pages/User/FriendsPage/FriendsPage"));
const MyActivitiesPage = lazy(() => import("./pages/User/MyActivities/MyActivitiesPage"));
import LeaderboardPage from "./pages/User/LeaderboardPage/LeaderboardPage"; // سياق عادي
const MainFriendPage = lazy(() => import("./pages/User/MainFriendPage/MainFriendPage"));

// ============================================================
//  صفحات المدير (Admin Pages) – تحميل كسول
// ============================================================
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
const SupervisorCandidacyPage = lazy(() => import("./pages/User/SupervisorCandidacy/SupervisorCandidacyPage"));
const ClansListPage = lazy(() => import("./pages/User/ClansPage/ClansListPage"));
const ClanPage = lazy(() => import("./pages/User/ClansPage/ClanPage"));
const CreateClanPage = lazy(() => import("./pages/User/ClansPage/CreateClanPage"));
const AdminTopUpSettings = lazy(() => import("./pages/Admin/AdminTopUpSettings/AdminTopUpSettings"));
const AdminDiscountSettings = lazy(() => import("./pages/Admin/AdminDiscountSettings/AdminDiscountSettings"));
const AdminMerchantSettings = lazy(() => import("./pages/Admin/AdminMerchantSettings/AdminMerchantSettings"));
const AdminUnifiedCatalog = lazy(() => import("./pages/Admin/AdminUnifiedCatalog/AdminUnifiedCatalog"));
const ContentManager = lazy(() => import("./components/AdminCoponent/ContentManager/ContentManager"));
const QuestsPage = lazy(() => import("./pages/User/QuestsPage/QuestsPage"));

// ============================================================
//  صفحات المدقق (Verifier Pages) – تحميل كسول
// ============================================================
const VerifierDashboard = lazy(() => import("./pages/Verifier/VerifierDashboard"));
const VerifierOrdersPage = lazy(() => import("./pages/Verifier/VerifierOrders"));
const ArchiveOrders = lazy(() => import("./components/VerifierComponents/ArchiveOrders/ArchiveOrders"));

// ============================================================
//  صفحة المدقق المالي – تحميل كسول
// ============================================================
const FinanceTopUpRequests = lazy(() => import("./pages/FinanceVerifier/FinanceTopUpRequests"));

// ============================================================
//  المكون الرئيسي للتطبيق
// ============================================================
function App() {
  const { user, userData, loading, emailVerified } = useAuth();
  const listenToBalance = useAppStore((state) => state.listenToBalance);
  const fetchProducts = useAppStore((state) => state.fetchProducts);

  // جلب المنتجات عند تحميل التطبيق
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // الاستماع لتحديثات الرصيد عند تسجيل الدخول
  useEffect(() => {
    if (user?.uid) {
      const unsubscribe = listenToBalance(user.uid);
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [user, listenToBalance]);

  // الاستماع لسعر الصرف وإعدادات الإيداع
  useEffect(() => {
    const unsubRate = useAppStore.getState().listenToExchangeRate?.();
    const unsubTopUp = useAppStore.getState().listenToTopUpSettings?.();
    return () => {
      if (unsubRate) unsubRate();
      if (unsubTopUp) unsubTopUp();
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
            background: "var(--color-bg-secondary)",
            color: "var(--color-text-primary)",
            borderRadius: "var(--radius-md)",
          },
          success: { iconTheme: { primary: "#10b981", secondary: "white" } },
          error: { iconTheme: { primary: "#ef4444", secondary: "white" } },
        }}
      />
      <Routes>
        {/* ===== مسارات المصادقة (بدون حماية) ===== */}
        <Route
          path="/login"
          element={
            !user || (user && !emailVerified) ? <Login /> : <Navigate to="/dashboard" />
          }
        />
        <Route
          path="/signup"
          element={
            !user || (user && !emailVerified) ? <SignupPage /> : <Navigate to="/dashboard" />
          }
        />
        <Route path="/verify-code" element={<VerifyCodePage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* ===== مسارات المستخدم (محمية) ===== */}
        <Route
          element={user && emailVerified ? <Layout /> : <Navigate to="/login" />}
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/apps/*" element={<AppsPage />} />
          <Route path="/transfer" element={<TransferPage />} />
          <Route path="/gaming/*" element={<GamingPage />} />
          <Route path="/chat/room/:roomId" element={<ChatRoom />} />
          <Route path="/quests" element={<QuestsPage />} />
          <Route path="/wheel" element={<WheelPage />} />
          <Route path="/referral" element={<ReferralPage />} />
          <Route path="/my-activities" element={<MyActivitiesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:userId" element={<PublicProfilePage />} />
          <Route path="/crypto" element={<CryptoPage />} />
          <Route path="/mianfriendspage" element={<MainFriendPage />} />
          <Route path="/sell-mgc" element={<SellMGC />} />
          <Route path="/exchange" element={<ExchangePage />} />
          <Route path="/supervisor-candidacy" element={<SupervisorCandidacyPage />} />
          <Route path="/search-user" element={<SearchUserPage />} />
          <Route path="/clans" element={<ClansListPage />} />
          <Route path="/clan/:clanId" element={<ClanPage />} />
          <Route path="/clan/create" element={<CreateClanPage />} />
          <Route path="/missions" element={<MissionsPage />} />
          <Route path="/memberships" element={<MembershipsPage />} />
          <Route path="/buy-mgc" element={<BuyMGC />} />
          <Route path="/my-orders" element={<MyOrdersPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/friends" element={<FriendsPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/topup" element={<TopUpPage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route
            path="/category/:categoryId"
            element={<CategoryProductsPage />}
          />
          <Route
            path="/category/:categoryId/:gameName"
            element={<CategoryProductsPage />}
          />
        </Route>

        {/* ===== مسارات المدير ===== */}
        <Route
          path="/admin"
          element={
            user && emailVerified && userData?.role === "admin" ? (
              <AdminLayout />
            ) : (
              <Navigate to="/dashboard" />
            )
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="services" element={<AdminServicesPage />} />
          <Route path="store-settings" element={<AdminStoreSettingsPage />} />
          <Route path="catalog" element={<AdminUnifiedCatalog />} />
          <Route
            path="external-store-import"
            element={<ExternalStoreImport />}
          />
          <Route path="content/:type/:itemId" element={<ContentManager />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
          <Route path="ticker" element={<AdminTicker />} />
          <Route path="verifiers" element={<AdminVerifiers />} />
          <Route
            path="page-instructions"
            element={<AdminPageInstructions />}
          />
          <Route path="exchange-rate" element={<AdminExchangeRate />} />
          <Route path="discounts" element={<AdminDiscountSettings />} />
          <Route
            path="merchant-settings"
            element={<AdminMerchantSettings />}
          />
          <Route path="ads" element={<AdManagementPage />} />
          <Route path="navigation" element={<AdminNavLinksPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="topup-settings" element={<AdminTopUpSettings />} />
        </Route>

        {/* ===== مسارات المدقق العادي ===== */}
        <Route
          path="/verifier"
          element={
            user && emailVerified && userData?.role === "verifier" ? (
              <VerifierLayout />
            ) : (
              <Navigate to="/dashboard" />
            )
          }
        >
          <Route path="archive" element={<ArchiveOrders />} />
          <Route index element={<VerifierDashboard />} />
          <Route path="orders" element={<VerifierOrdersPage />} />
        </Route>

        {/* ===== مسار المدقق المالي ===== */}
        <Route
          path="/finance-verifier"
          element={
            user && emailVerified && userData?.role === "finance_verifier" ? (
              <Suspense fallback={<Loading text="جاري تحميل لوحة التدقيق المالي..." />}>
                <FinanceTopUpRequests />
              </Suspense>
            ) : (
              <Navigate to="/dashboard" />
            )
          }
        />

        {/* ===== أي مسار غير معروف ===== */}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Suspense>
  );
}

export default App;