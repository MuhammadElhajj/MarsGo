// src/App.jsx
import { lazy, Suspense, useEffect, useMemo } from "react";
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
//  صفحات المستخدم (User Pages) – تحميل كسول (Lazy Loading)
// ============================================================
const Login = lazy(() => import("./pages/User/Login/Login"));
const SignupPage = lazy(() => import("./pages/User/Login/SignupPage"));
const VerifyCodePage = lazy(() => import("./pages/User/VerifyCode/VerifyCodePage"));
const ForgotPasswordPage = lazy(() => import("./pages/User/ForgotPassword/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/User/ResetPassword/ResetPasswordPage"));

const Dashboard = lazy(() => import("./pages/User/Dashboard/Dashboard"));
const SearchPage = lazy(() => import("./pages/User/SearchPage/SearchPage"));
const AppsPage = lazy(() => import("./pages/User/Apps/AppsPage"));
const TransferPage = lazy(() => import("./pages/User/Transfer/TransferPage"));
const GamingPage = lazy(() => import("./pages/User/Gaming/GamingPage"));
const ChatPage = lazy(() => import("./components/UserComponents/Chat/ChatPage"));
const ChatRoom = lazy(() => import("./components/UserComponents/Chat/ChatRoom"));
const QuestsPage = lazy(() => import("./pages/User/QuestsPage/QuestsPage"));
const WheelPage = lazy(() => import("./components/UserComponents/WheelPage/WheelPage"));
const ReferralPage = lazy(() => import("./pages/User/ReferralPage/ReferralPage"));
const MyActivitiesPage = lazy(() => import("./pages/User/MyActivities/MyActivitiesPage"));
const ProfilePage = lazy(() => import("./components/UserComponents/Profile/ProfilePage"));
const PublicProfilePage = lazy(() => import("./components/UserComponents/PublicProfile/PublicProfilePage"));
const CryptoPage = lazy(() => import("./pages/User/Crypto/CryptoPage"));
const MainFriendPage = lazy(() => import("./pages/User/MainFriendPage/MainFriendPage"));
const SellMGC = lazy(() => import("./pages/User/SellMGC/SellMGC"));
const ExchangePage = lazy(() => import("./pages/User/Exchange/ExchangePage"));
const SupervisorCandidacyPage = lazy(() => import("./pages/User/SupervisorCandidacy/SupervisorCandidacyPage"));
const SearchUserPage = lazy(() => import("./pages/User/SearchUserPage/SearchUserPage"));
const ClansListPage = lazy(() => import("./pages/User/ClansPage/ClansListPage"));
const ClanPage = lazy(() => import("./pages/User/ClansPage/ClanPage"));
const CreateClanPage = lazy(() => import("./pages/User/ClansPage/CreateClanPage"));
const MissionsPage = lazy(() => import("./pages/User/MissionsPage/MissionsPage"));
const MembershipsPage = lazy(() => import("./pages/User/MembershipsPage/MembershipsPage"));
const BuyMGC = lazy(() => import("./pages/User/BuyMGC/BuyMGC"));
const MachinePage = lazy(() => import("./pages/User/MachinePage/MachinePage"));
const GamesHubPage = lazy(() => import("./pages/User/GamesHubPage/GamesHubPage"));
const AddPhonePage = lazy(() => import("./pages/User/AddPhonePage/AddPhonePage"));
const MyOrdersPage = lazy(() => import("./pages/User/MyOrders/MyOrdersPage"));
const NotificationsPage = lazy(() => import("./pages/User/Notifications/NotificationsPage"));
const LeaderboardPage = lazy(() => import("./pages/User/LeaderboardPage/LeaderboardPage"));
const AboutPage = lazy(() => import("./pages/User/About/AboutPage"));
const ReviewsPage = lazy(() => import("./pages/User/ReviewsPage/ReviewsPage"));
const FriendsPage = lazy(() => import("./pages/User/FriendsPage/FriendsPage"));
const PrivacyPolicy = lazy(() => import("./pages/User/PrivacyPolicy/PrivacyPolicy"));
const TopUpPage = lazy(() => import("./pages/User/TopUp/TopUpPage"));
const CatalogPage = lazy(() => import("./pages/User/Catalog/CatalogPage"));
const CategoryProductsPage = lazy(() => import("./pages/User/CategoryProductsPage/CategoryProductsPage"));
const GamePackagesPage = lazy(() => import("./pages/User/GamePackagesPage/GamePackagesPage"));

// ============================================================
//  صفحات المدير (Admin Pages) – تحميل كسول
// ============================================================
const AdminDashboard = lazy(() => import("./pages/Admin/AdminDashboard/AdminDashboard"));
const AdminUserDetails = lazy(() => import("./components/AdminCoponent/UserDetails/UserDetails"));
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
const SupervisorCandidacyPageAdmin = lazy(() => import("./pages/User/SupervisorCandidacy/SupervisorCandidacyPage"));
const ClansListPageAdmin = lazy(() => import("./pages/User/ClansPage/ClansListPage"));
const ClanPageAdmin = lazy(() => import("./pages/User/ClansPage/ClanPage"));
const CreateClanPageAdmin = lazy(() => import("./pages/User/ClansPage/CreateClanPage"));
const AdminTopUpSettings = lazy(() => import("./pages/Admin/AdminTopUpSettings/AdminTopUpSettings"));
const AdminDiscountSettings = lazy(() => import("./pages/Admin/AdminDiscountSettings/AdminDiscountSettings"));
const AdminMerchantSettings = lazy(() => import("./pages/Admin/AdminMerchantSettings/AdminMerchantSettings"));
const AdminUnifiedCatalog = lazy(() => import("./pages/Admin/AdminUnifiedCatalog/AdminUnifiedCatalog"));
const ContentManager = lazy(() => import("./components/AdminCoponent/ContentManager/ContentManager"));
const AdminMissions = lazy(() => import("./pages/Admin/AdminMissions/AdminMissions"));

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
            !user || (user && !emailVerified) ? (
              <Suspense fallback={<Loading />}>
                <Login />
              </Suspense>
            ) : (
              <Navigate to="/dashboard" />
            )
          }
        />
        <Route
          path="/signup"
          element={
            !user || (user && !emailVerified) ? (
              <Suspense fallback={<Loading />}>
                <SignupPage />
              </Suspense>
            ) : (
              <Navigate to="/dashboard" />
            )
          }
        />
        <Route
          path="/verify-code"
          element={
            <Suspense fallback={<Loading />}>
              <VerifyCodePage />
            </Suspense>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <Suspense fallback={<Loading />}>
              <ForgotPasswordPage />
            </Suspense>
          }
        />
        <Route
          path="/reset-password"
          element={
            <Suspense fallback={<Loading />}>
              <ResetPasswordPage />
            </Suspense>
          }
        />

        {/* ===== مسارات المستخدم (محمية) ===== */}
        <Route
          element={user && emailVerified ? <Layout /> : <Navigate to="/login" />}
        >
          <Route
            path="/dashboard"
            element={
              <Suspense fallback={<Loading />}>
                <Dashboard />
              </Suspense>
            }
          />
          <Route
            path="/search"
            element={
              <Suspense fallback={<Loading />}>
                <SearchPage />
              </Suspense>
            }
          />
          <Route
            path="/apps/*"
            element={
              <Suspense fallback={<Loading />}>
                <AppsPage />
              </Suspense>
            }
          />
          <Route
            path="/transfer"
            element={
              <Suspense fallback={<Loading />}>
                <TransferPage />
              </Suspense>
            }
          />
          <Route
            path="/gaming/*"
            element={
              <Suspense fallback={<Loading />}>
                <GamingPage />
              </Suspense>
            }
          />
          <Route
            path="/chat/room/:roomId"
            element={
              <Suspense fallback={<Loading />}>
                <ChatRoom />
              </Suspense>
            }
          />
          <Route
            path="/quests"
            element={
              <Suspense fallback={<Loading />}>
                <QuestsPage />
              </Suspense>
            }
          />
          <Route
            path="/games-hub/wheel"
            element={
              <Suspense fallback={<Loading />}>
                <WheelPage />
              </Suspense>
            }
          />
          <Route
            path="/games-hub/machine"
            element={
              <Suspense fallback={<Loading />}>
                <MachinePage />
              </Suspense>
            }
          />
          <Route
            path="/games-hub"
            element={
              <Suspense fallback={<Loading />}>
                <GamesHubPage />
              </Suspense>
            }
          />
          <Route
            path="/referral"
            element={
              <Suspense fallback={<Loading />}>
                <ReferralPage />
              </Suspense>
            }
          />
          <Route
            path="/my-activities"
            element={
              <Suspense fallback={<Loading />}>
                <MyActivitiesPage />
              </Suspense>
            }
          />
          <Route
            path="/profile"
            element={
              <Suspense fallback={<Loading />}>
                <ProfilePage />
              </Suspense>
            }
          />
          <Route
            path="/profile/:userId"
            element={
              <Suspense fallback={<Loading />}>
                <PublicProfilePage />
              </Suspense>
            }
          />
          <Route
            path="/crypto"
            element={
              <Suspense fallback={<Loading />}>
                <CryptoPage />
              </Suspense>
            }
          />
          <Route
            path="/mianfriendspage"
            element={
              <Suspense fallback={<Loading />}>
                <MainFriendPage />
              </Suspense>
            }
          />
          <Route
            path="/sell-mgc"
            element={
              <Suspense fallback={<Loading />}>
                <SellMGC />
              </Suspense>
            }
          />
          <Route
            path="/exchange"
            element={
              <Suspense fallback={<Loading />}>
                <ExchangePage />
              </Suspense>
            }
          />
          <Route
            path="/supervisor-candidacy"
            element={
              <Suspense fallback={<Loading />}>
                <SupervisorCandidacyPage />
              </Suspense>
            }
          />
          <Route
            path="/search-user"
            element={
              <Suspense fallback={<Loading />}>
                <SearchUserPage />
              </Suspense>
            }
          />
          <Route
            path="/clans"
            element={
              <Suspense fallback={<Loading />}>
                <ClansListPage />
              </Suspense>
            }
          />
          <Route
            path="/clan/:clanId"
            element={
              <Suspense fallback={<Loading />}>
                <ClanPage />
              </Suspense>
            }
          />
          <Route
            path="/clan/create"
            element={
              <Suspense fallback={<Loading />}>
                <CreateClanPage />
              </Suspense>
            }
          />
          <Route
            path="/missions"
            element={
              <Suspense fallback={<Loading />}>
                <MissionsPage />
              </Suspense>
            }
          />
          <Route
            path="/memberships"
            element={
              <Suspense fallback={<Loading />}>
                <MembershipsPage />
              </Suspense>
            }
          />
          <Route
            path="/buy-mgc"
            element={
              <Suspense fallback={<Loading />}>
                <BuyMGC />
              </Suspense>
            }
          />
          <Route
            path="/add-phone"
            element={
              <Suspense fallback={<Loading />}>
                <AddPhonePage />
              </Suspense>
            }
          />
          <Route
            path="/my-orders"
            element={
              <Suspense fallback={<Loading />}>
                <MyOrdersPage />
              </Suspense>
            }
          />
          <Route
            path="/notifications"
            element={
              <Suspense fallback={<Loading />}>
                <NotificationsPage />
              </Suspense>
            }
          />
          <Route
            path="/leaderboard"
            element={
              <Suspense fallback={<Loading />}>
                <LeaderboardPage />
              </Suspense>
            }
          />
          <Route
            path="/about"
            element={
              <Suspense fallback={<Loading />}>
                <AboutPage />
              </Suspense>
            }
          />
          <Route
            path="/reviews"
            element={
              <Suspense fallback={<Loading />}>
                <ReviewsPage />
              </Suspense>
            }
          />
          <Route
            path="/friends"
            element={
              <Suspense fallback={<Loading />}>
                <FriendsPage />
              </Suspense>
            }
          />
          <Route
            path="/chat"
            element={
              <Suspense fallback={<Loading />}>
                <ChatPage />
              </Suspense>
            }
          />
          <Route
            path="/privacy-policy"
            element={
              <Suspense fallback={<Loading />}>
                <PrivacyPolicy />
              </Suspense>
            }
          />
          <Route
            path="/topup"
            element={
              <Suspense fallback={<Loading />}>
                <TopUpPage />
              </Suspense>
            }
          />
          <Route
            path="/catalog"
            element={
              <Suspense fallback={<Loading />}>
                <CatalogPage />
              </Suspense>
            }
          />
          <Route
            path="/category/:categoryId"
            element={
              <Suspense fallback={<Loading />}>
                <CategoryProductsPage />
              </Suspense>
            }
          />
          <Route
            path="/category/:categoryId/:gameName"
            element={
              <Suspense fallback={<Loading />}>
                <CategoryProductsPage />
              </Suspense>
            }
          />
          <Route
            path="/game/:gameName/packages"
            element={
              <Suspense fallback={<Loading />}>
                <GamePackagesPage />
              </Suspense>
            }
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
          <Route
            index
            element={
              <Suspense fallback={<Loading />}>
                <AdminDashboard />
              </Suspense>
            }
          />
          <Route
            path="orders"
            element={
              <Suspense fallback={<Loading />}>
                <AdminOrdersPage />
              </Suspense>
            }
          />
          <Route
            path="services"
            element={
              <Suspense fallback={<Loading />}>
                <AdminServicesPage />
              </Suspense>
            }
          />
          <Route
            path="user/:userId"
            element={
              <Suspense fallback={<Loading />}>
                <AdminUserDetails />
              </Suspense>
            }
          />
          <Route
            path="store-settings"
            element={
              <Suspense fallback={<Loading />}>
                <AdminStoreSettingsPage />
              </Suspense>
            }
          />
          <Route
            path="catalog"
            element={
              <Suspense fallback={<Loading />}>
                <AdminUnifiedCatalog />
              </Suspense>
            }
          />
          <Route
            path="external-store-import"
            element={
              <Suspense fallback={<Loading />}>
                <ExternalStoreImport />
              </Suspense>
            }
          />
          <Route
            path="missions"
            element={
              <Suspense fallback={<Loading />}>
                <AdminMissions />
              </Suspense>
            }
          />
          <Route
            path="content/:type/:itemId"
            element={
              <Suspense fallback={<Loading />}>
                <ContentManager />
              </Suspense>
            }
          />
          <Route
            path="categories"
            element={
              <Suspense fallback={<Loading />}>
                <AdminCategories />
              </Suspense>
            }
          />
          <Route
            path="ticker"
            element={
              <Suspense fallback={<Loading />}>
                <AdminTicker />
              </Suspense>
            }
          />
          <Route
            path="verifiers"
            element={
              <Suspense fallback={<Loading />}>
                <AdminVerifiers />
              </Suspense>
            }
          />
          <Route
            path="page-instructions"
            element={
              <Suspense fallback={<Loading />}>
                <AdminPageInstructions />
              </Suspense>
            }
          />
          <Route
            path="exchange-rate"
            element={
              <Suspense fallback={<Loading />}>
                <AdminExchangeRate />
              </Suspense>
            }
          />
          <Route
            path="discounts"
            element={
              <Suspense fallback={<Loading />}>
                <AdminDiscountSettings />
              </Suspense>
            }
          />
          <Route
            path="merchant-settings"
            element={
              <Suspense fallback={<Loading />}>
                <AdminMerchantSettings />
              </Suspense>
            }
          />
          <Route
            path="ads"
            element={
              <Suspense fallback={<Loading />}>
                <AdManagementPage />
              </Suspense>
            }
          />
          <Route
            path="navigation"
            element={
              <Suspense fallback={<Loading />}>
                <AdminNavLinksPage />
              </Suspense>
            }
          />
          <Route
            path="users"
            element={
              <Suspense fallback={<Loading />}>
                <AdminUsersPage />
              </Suspense>
            }
          />
          <Route
            path="topup-settings"
            element={
              <Suspense fallback={<Loading />}>
                <AdminTopUpSettings />
              </Suspense>
            }
          />
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
          <Route
            index
            element={
              <Suspense fallback={<Loading />}>
                <VerifierDashboard />
              </Suspense>
            }
          />
          <Route
            path="orders"
            element={
              <Suspense fallback={<Loading />}>
                <VerifierOrdersPage />
              </Suspense>
            }
          />
          <Route
            path="archive"
            element={
              <Suspense fallback={<Loading />}>
                <ArchiveOrders />
              </Suspense>
            }
          />
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