// // src/pages/User/Dashboard/Dashboard.jsx
// import { Suspense, lazy, useEffect, useState, useMemo } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from "../../../context/AuthContext";
// import { useAppStore } from "../../../store/store";
// import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
// import { db } from '../../../firebase';
// import useStats from "../../../hooks/useStats";
// import useUserStats from "../../../hooks/useUserStats";
// import Loading from "../../../components/GeneralComponents/Loading/Loading";
// import './Dashboard.css';

// // ===== lazy imports للمكونات الثقيلة =====
// const StoreIntro = lazy(() => import("../../../components/UserComponents/StoreIntro/StoreIntro"));
// const CatalogList = lazy(() => import("../../../components/Generic/CatalogList/CatalogList"));
// const VisaCard = lazy(() => import("../../../components/GeneralComponents/VisaCard/VisaCard"));
// const PaymentMethods = lazy(() => import("../../../components/UserComponents/PaymentMethods/PaymentMethods"));
// const CatalogSection = lazy(() => import("../../../components/Generic/CatalogSection/CatalogSection"));
// const QuickActions = lazy(() => import("../../../components/UserComponents/QuickActions/QuickActions"));
// const HowItWorks = lazy(() => import("../../../components/UserComponents/HowItWorks/HowItWorks"));
// const AdSpace = lazy(() => import("../../../components/UserComponents/AdSpace/AdSpace"));
// const UserStatsGrid = lazy(() => import("../../../components/UserComponents/UserStatsGrid/UserStatsGrid"));
// const ServicesGrid = lazy(() => import("../../../components/UserComponents/ServicesGrid/ServicesGrid"));
// const OrdersList = lazy(() => import("../../../components/UserComponents/OrdersList/OrdersList"));
// const SpendingProgress = lazy(() => import("../../../components/UserComponents/SpendingProgress/SpendingProgress"));
// const WhyChooseUs = lazy(() => import("../../../components/UserComponents/WhyChooseUs/WhyChooseUs"));
// const RecentlyViewed = lazy(() => import("../../../components/UserComponents/RecentlyViewed/RecentlyViewed"));

// export default function Dashboard() {
//   const { userData } = useAuth();
//   const navigate = useNavigate();
//   const balance = useAppStore((state) => state.balance);
//   const mgcBalance = useAppStore((state) => state.mgcBalance);
//   const { stats, loading: statsLoading } = useStats();
//   const { stats: userStats, loading: userStatsLoading } = useUserStats();

//   // ===== الألعاب =====
//   const { games, setGames } = useAppStore();
//   const [gamesLoading, setGamesLoading] = useState(!games || games.length === 0);

//   useEffect(() => {
//     const fetchGames = async () => {
//       if (games && games.length > 0) {
//         setGamesLoading(false);
//         return;
//       }
//       setGamesLoading(true);
//       try {
//         // ✅ تحسين: استخدام limit لتقليل عدد العناصر المسترجعة
//         const q = query(collection(db, 'games'), orderBy('order', 'asc'), limit(12));
//         const snapshot = await getDocs(q);
//         const gamesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//         setGames(gamesList);
//       } catch (err) {
//         console.error('خطأ في جلب الألعاب:', err);
//       } finally {
//         setGamesLoading(false);
//       }
//     };
//     fetchGames();
//   }, [games, setGames]);

//   // ===== التطبيقات =====
//   const { apps, setApps } = useAppStore();
//   const [appsLoading, setAppsLoading] = useState(!apps || apps.length === 0);

//   useEffect(() => {
//     const fetchApps = async () => {
//       if (apps && apps.length > 0) {
//         setAppsLoading(false);
//         return;
//       }
//       setAppsLoading(true);
//       try {
//         // ✅ تحسين: استخدام limit لتقليل عدد العناصر المسترجعة
//         const q = query(collection(db, 'apps'), orderBy('order', 'asc'), limit(12));
//         const snapshot = await getDocs(q);
//         const appsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//         setApps(appsList);
//       } catch (err) {
//         console.error('خطأ في جلب التطبيقات:', err);
//       } finally {
//         setAppsLoading(false);
//       }
//     };
//     fetchApps();
//   }, [apps, setApps]);

//   // ✅ استخدام useMemo لمنع إعادة إنشاء الدوال عند كل تصيير
//   const handleGameClick = useMemo(() => (game) => {
//     navigate(`/gaming/game/${game.id}`);
//   }, [navigate]);

//   const handleViewAllGames = useMemo(() => () => {
//     navigate('/gaming');
//   }, [navigate]);

//   const handleAppClick = useMemo(() => (app) => {
//     navigate(`/apps/app/${app.id}`);
//   }, [navigate]);

//   const handleViewAllApps = useMemo(() => () => {
//     navigate('/apps');
//   }, [navigate]);

//   // ===== حالة التحميل العامة =====
//   if (statsLoading || gamesLoading || appsLoading) {
//     return <Loading text="جاري تحميل لوحة التحكم..." />;
//   }

//   return (
//     <div className="dashboard" dir="rtl">
//       {/* ===== فيزا كارد ===== */}
//       <div className="dashboard__visa-wrapper">
//         <Suspense fallback={<Loading text="جاري تحميل البطاقة..." />}>
//           <VisaCard 
//             balance={balance} 
//             mgcBalance={mgcBalance}
//             cardHolderName={userData?.name || 'MarsGo User'}
//             cardNumber={userData?.visaNumber}
//             brand="MarsGo Visa"
//             secret={userData?.visaSecret}
//           />
//         </Suspense>
//       </div>

//       {/* ===== الإجراءات السريعة ===== */}
//       <Suspense fallback={<Loading text="جاري التحميل..." />}>
//         <QuickActions />
//       </Suspense>

//       {/* ===== طرق الدفع ===== */}
//       <Suspense fallback={<Loading text="جاري التحميل..." />}>
//         <PaymentMethods />
//       </Suspense>

//       {/* ===== الألعاب ===== */}
//       <Suspense fallback={<Loading text="جاري تحميل الألعاب..." />}>
//         <CatalogSection
//           title="الألعاب الأكثر مبيعاً"
//           description="آمنة وبأسعار مناسبة دائماً"
//           items={games}
//           type="game"
//           onItemClick={handleGameClick}
//           onViewAll={handleViewAllGames}
//           showPrice={true}
//           maxItemsDesktop={12}
//           maxItemsMobile={6}
//         />
//       </Suspense>

//       {/* ===== التطبيقات ===== */}
//       <Suspense fallback={<Loading text="جاري تحميل التطبيقات..." />}>
//         <CatalogSection
//           title="التطبيقات الأكثر مبيعاً"
//           description="تطبيقات متنوعة بأسعار تنافسية"
//           items={apps}
//           type="app"
//           onItemClick={handleAppClick}
//           onViewAll={handleViewAllApps}
//           showPrice={true}
//           maxItemsDesktop={12}
//           maxItemsMobile={6}
//         />
//       </Suspense>

//       {/* ===== الإعلانات ===== */}
//       <Suspense fallback={<Loading text="جاري تحميل الإعلانات..." />}>
//         <AdSpace />
//       </Suspense>

//       {/* ===== مقدمة المتجر ===== */}
//       <Suspense fallback={<Loading text="جاري التحميل..." />}>
//         <StoreIntro />
//       </Suspense>

//       {/* ===== لماذا نحن ===== */}
//       <Suspense fallback={<Loading text="جاري تحميل المزيد..." />}>
//         <WhyChooseUs />
//       </Suspense>
//     </div>
//   );
// }

// src/pages/User/Dashboard/Dashboard.jsx
import { Suspense, lazy, useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../../../context/AuthContext";
import { useAppStore } from "../../../store/store";
import { useShallow } from 'zustand/react/shallow';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../firebase';
import useStats from "../../../hooks/useStats";
import useUserStats from "../../../hooks/useUserStats";
import Loading from "../../../components/GeneralComponents/Loading/Loading";
import './Dashboard.css';

// ===== lazy imports للمكونات الثقيلة =====
const StoreIntro = lazy(() => import("../../../components/UserComponents/StoreIntro/StoreIntro"));
const VisaCard = lazy(() => import("../../../components/GeneralComponents/VisaCard/VisaCard"));
const PaymentMethods = lazy(() => import("../../../components/UserComponents/PaymentMethods/PaymentMethods"));
const CatalogSection = lazy(() => import("../../../components/Generic/CatalogSection/CatalogSection"));
const QuickActions = lazy(() => import("../../../components/UserComponents/QuickActions/QuickActions"));
const AdSpace = lazy(() => import("../../../components/UserComponents/AdSpace/AdSpace"));
const WhyChooseUs = lazy(() => import("../../../components/UserComponents/WhyChooseUs/WhyChooseUs"));

export default function Dashboard() {
  const { userData } = useAuth();
  const navigate = useNavigate();

  // ✅ استخدام useShallow لتجميع الحالات وتقليل إعادة التصيير
  const { balance, mgcBalance, games, setGames, apps, setApps } = useAppStore(
    useShallow((state) => ({
      balance: state.balance,
      mgcBalance: state.mgcBalance,
      games: state.games,
      setGames: state.setGames,
      apps: state.apps,
      setApps: state.setApps,
    }))
  );

  // ===== تأخير تحميل الإحصائيات والمكونات الثانوية =====
  const [loadStats, setLoadStats] = useState(false);
  const [showSecondary, setShowSecondary] = useState(false);

  useEffect(() => {
    // تأخير تحميل الإحصائيات 500ms بعد ظهور المحتوى الأساسي
    const timer1 = setTimeout(() => setLoadStats(true), 500);
    // تأخير تحميل المكونات الثانوية 800ms
    const timer2 = setTimeout(() => setShowSecondary(true), 800);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  // ===== هوكات الإحصائيات (مع enabled) =====
  const { stats, loading: statsLoading } = useStats(loadStats);
  const { stats: userStats, loading: userStatsLoading } = useUserStats(loadStats);

  // ===== الألعاب =====
  const [gamesLoading, setGamesLoading] = useState(!games || games.length === 0);

  useEffect(() => {
    const fetchGames = async () => {
      if (games && games.length > 0) {
        setGamesLoading(false);
        return;
      }
      setGamesLoading(true);
      try {
        const q = query(collection(db, 'games'), orderBy('order', 'asc'), limit(12));
        const snapshot = await getDocs(q);
        const gamesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setGames(gamesList);
      } catch (err) {
        console.error('خطأ في جلب الألعاب:', err);
      } finally {
        setGamesLoading(false);
      }
    };
    fetchGames();
  }, [games, setGames]);

  // ===== التطبيقات =====
  const [appsLoading, setAppsLoading] = useState(!apps || apps.length === 0);

  useEffect(() => {
    const fetchApps = async () => {
      if (apps && apps.length > 0) {
        setAppsLoading(false);
        return;
      }
      setAppsLoading(true);
      try {
        const q = query(collection(db, 'apps'), orderBy('order', 'asc'), limit(12));
        const snapshot = await getDocs(q);
        const appsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setApps(appsList);
      } catch (err) {
        console.error('خطأ في جلب التطبيقات:', err);
      } finally {
        setAppsLoading(false);
      }
    };
    fetchApps();
  }, [apps, setApps]);

  // ✅ useMemo للدوال
  const handleGameClick = useMemo(() => (game) => {
    navigate(`/gaming/game/${game.id}`);
  }, [navigate]);

  const handleViewAllGames = useMemo(() => () => {
    navigate('/gaming');
  }, [navigate]);

  const handleAppClick = useMemo(() => (app) => {
    navigate(`/apps/app/${app.id}`);
  }, [navigate]);

  const handleViewAllApps = useMemo(() => () => {
    navigate('/apps');
  }, [navigate]);

  // ===== حالة التحميل العامة =====
  // نتحقق من اكتمال تحميل الألعاب والتطبيقات (الإحصائيات متأخرة)
  if (gamesLoading || appsLoading) {
    return <Loading text="جاري تحميل لوحة التحكم..." />;
  }

  return (
    <div className="dashboard" dir="rtl">
      {/* ===== فيزا كارد ===== */}
      <div className="dashboard__visa-wrapper">
        <Suspense fallback={<Loading text="جاري تحميل البطاقة..." />}>
          <VisaCard 
            balance={balance} 
            mgcBalance={mgcBalance}
            cardHolderName={userData?.name || 'MarsGo User'}
            cardNumber={userData?.visaNumber}
            brand="MarsGo Visa"
            secret={userData?.visaSecret}
          />
        </Suspense>
      </div>

      {/* ===== الإجراءات السريعة ===== */}
      <Suspense fallback={<Loading text="جاري التحميل..." />}>
        <QuickActions />
      </Suspense>

      {/* ===== طرق الدفع ===== */}
      <Suspense fallback={<Loading text="جاري التحميل..." />}>
        <PaymentMethods />
      </Suspense>

      {/* ===== الألعاب ===== */}
      <Suspense fallback={<Loading text="جاري تحميل الألعاب..." />}>
        <CatalogSection
          title="الألعاب الأكثر مبيعاً"
          description="آمنة وبأسعار مناسبة دائماً"
          items={games}
          type="game"
          onItemClick={handleGameClick}
          onViewAll={handleViewAllGames}
          showPrice={true}
          maxItemsDesktop={12}
          maxItemsMobile={6}
        />
      </Suspense>

      {/* ===== التطبيقات ===== */}
      <Suspense fallback={<Loading text="جاري تحميل التطبيقات..." />}>
        <CatalogSection
          title="التطبيقات الأكثر مبيعاً"
          description="تطبيقات متنوعة بأسعار تنافسية"
          items={apps}
          type="app"
          onItemClick={handleAppClick}
          onViewAll={handleViewAllApps}
          showPrice={true}
          maxItemsDesktop={12}
          maxItemsMobile={6}
        />
      </Suspense>

      {/* ===== المكونات الثانوية (تظهر بعد 800ms) ===== */}
      {showSecondary && (
        <>
          <Suspense fallback={<Loading text="جاري تحميل الإعلانات..." />}>
            <AdSpace />
          </Suspense>
          <Suspense fallback={<Loading text="جاري التحميل..." />}>
            <StoreIntro />
          </Suspense>
          <Suspense fallback={<Loading text="جاري تحميل المزيد..." />}>
            <WhyChooseUs />
          </Suspense>
        </>
      )}
    </div>
  );
}