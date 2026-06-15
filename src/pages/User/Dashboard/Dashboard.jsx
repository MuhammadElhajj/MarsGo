

// // src/pages/User/Dashboard/Dashboard.jsx
// import { Suspense, lazy, useEffect, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from "../../../context/AuthContext";
// import { useAppStore } from "../../../store/store";
// import { collection, getDocs, query, orderBy } from 'firebase/firestore';
// import { db } from '../../../firebase';
// import useStats from "../../../hooks/useStats";
// import useUserStats from "../../../hooks/useUserStats";
// import Loading from "../../../components/GeneralComponents/Loading/Loading";
// import StoreIntro from "../../../components/UserComponents/StoreIntro/StoreIntro";
// import CatalogList from "../../../components/Generic/CatalogList/CatalogList";
// import './Dashboard.css';

// // Lazy imports (كما هي)
// const HowItWorks = lazy(() => import("../../../components/UserComponents/HowItWorks/HowItWorks"));
// const AdSpace = lazy(() => import("../../../components/UserComponents/AdSpace/AdSpace"));
// const UserStatsGrid = lazy(() => import("../../../components/UserComponents/UserStatsGrid/UserStatsGrid"));
// const ServicesGrid = lazy(() => import("../../../components/UserComponents/ServicesGrid/ServicesGrid"));
// const OrdersList = lazy(() => import("../../../components/UserComponents/OrdersList/OrdersList"));
// const SpendingProgress = lazy(() => import("../../../components/UserComponents/SpendingProgress/SpendingProgress"));

// const BalanceDisplay = lazy(() => import('../../../components/GeneralComponents/BalanceDisplay/BalanceDisplay'));
// const TopUpButton = lazy(() => import('../../../components/GeneralComponents/TopUpButton/TopUpButton'));

// export default function Dashboard() {
//   const { userData } = useAuth();
//   const { stats, loading: statsLoading } = useStats();
//   const { stats: userStats, loading: userStatsLoading } = useUserStats();
//   const navigate = useNavigate();

//   // ===== الألعاب =====
//   const { games, setGames } = useAppStore();
//   const [gamesLoading, setGamesLoading] = useState(!games || games.length === 0);
//   const [gamesToDisplay, setGamesToDisplay] = useState([]);

//   useEffect(() => {
//     const fetchGames = async () => {
//       if (games && games.length > 0) {
//         setGamesToDisplay(games.slice(0, 6));
//         setGamesLoading(false);
//         return;
//       }
//       setGamesLoading(true);
//       try {
//         const q = query(collection(db, 'games'), orderBy('order', 'asc'));
//         const snapshot = await getDocs(q);
//         const gamesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//         setGames(gamesList);
//         setGamesToDisplay(gamesList.slice(0, 6));
//       } catch (err) {
//         console.error('خطأ في جلب الألعاب:', err);
//       } finally {
//         setGamesLoading(false);
//       }
//     };
//     fetchGames();
//   }, [games, setGames]);

//   const handleGameClick = (game) => {
//     navigate(`/gaming/game/${game.id}`);
//   };

//   const handleViewAllGames = () => {
//     navigate('/gaming');
//   };

//   // ===== التطبيقات =====
//   const { apps, setApps } = useAppStore();
//   const [appsLoading, setAppsLoading] = useState(!apps || apps.length === 0);
//   const [appsToDisplay, setAppsToDisplay] = useState([]);

//   useEffect(() => {
//     const fetchApps = async () => {
//       if (apps && apps.length > 0) {
//         setAppsToDisplay(apps.slice(0, 6));
//         setAppsLoading(false);
//         return;
//       }
//       setAppsLoading(true);
//       try {
//         const q = query(collection(db, 'apps'), orderBy('order', 'asc'));
//         const snapshot = await getDocs(q);
//         const appsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//         setApps(appsList);
//         setAppsToDisplay(appsList.slice(0, 6));
//       } catch (err) {
//         console.error('خطأ في جلب التطبيقات:', err);
//       } finally {
//         setAppsLoading(false);
//       }
//     };
//     fetchApps();
//   }, [apps, setApps]);

//   const handleAppClick = (app) => {
//     navigate(`/apps/app/${app.id}`);
//   };

//   const handleViewAllApps = () => {
//     navigate('/apps');
//   };

//   if (statsLoading) return <Loading />;

//   return (
//     <div className="dashboard" dir="rtl">
//       {/* صف الرصيد والإعلانات */}
//       <Suspense fallback={<Loading text="جاري تحميل الإعلانات..." />}>
//         <AdSpace />
//       </Suspense>
//       <div className="dashboard__balance-row">
//         <Suspense fallback={<div className="balance-placeholder">...</div>}>
//           <BalanceDisplay />
//         </Suspense>
//         <Suspense fallback={<div className="topup-placeholder">...</div>}>
//           <TopUpButton />
//         </Suspense>
//       </div>

//       {/* <SpendingProgress /> */}

//       {/* ===== قسم الألعاب ===== */}
//       <div className="dashboard__hot-games-section">
//         <div className="dashboard__hot-games-header">
//           <div>
//             <h2> الألعاب الأكثر مبيعاً</h2>
//             <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
//               آمنة وبأسعار مناسبة دائماً
//             </p>
//           </div>
//         </div>
//         {gamesLoading ? (
//           <div className="loading-wrapper">جاري تحميل الألعاب...</div>
//         ) : (
//           <>
//             <CatalogList
//               items={gamesToDisplay}
//               onItemClick={handleGameClick}
//               showPrice={true}
//               type="game"
//               showBackButton={false}
//               title=""
//             />
//             <div className="dashboard__hot-games-footer">
//               <span className="view-more-link" onClick={handleViewAllGames}>
//                 المزيد <span className="arrow">›</span>
//               </span>
//             </div>
//           </>
//         )}
//       </div>

//       {/* ===== قسم التطبيقات ===== */}
//       <div className="dashboard__hot-apps-section">
//         <div className="dashboard__hot-apps-header">
//           <div>
//             <h2> التطبيقات الأكثر مبيعاً</h2>
//             <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
//               تطبيقات متنوعة بأسعار تنافسية
//             </p>
//           </div>
//         </div>
//         {appsLoading ? (
//           <div className="loading-wrapper">جاري تحميل التطبيقات...</div>
//         ) : (
//           <>
//             <CatalogList
//               items={appsToDisplay}
//               onItemClick={handleAppClick}
//               showPrice={true}
//               type="app"
//               showBackButton={false}
//               title=""
//             />
//             <div className="dashboard__hot-games-footer">
//               <span className="view-more-link" onClick={handleViewAllApps}>
//                 المزيد <span className="arrow">›</span>
//               </span>
//             </div>
            
//           </>
//         )}
//       </div>
//   <StoreIntro />
//       {/* باقي المحتوى */}
//       <div className="dashboard__services">
//         <h3 className="dashboard__services-title">خدماتنا الرقمية</h3>
//         <Suspense fallback={<Loading text="جاري تحميل الخدمات..." />}>
//           <ServicesGrid />
//         </Suspense>
//       </div>
    

//       <h3 className="dashboard__services-title">إحصائيات المستخدم</h3>
//       <Suspense fallback={<Loading text="جاري تحميل الإحصائيات..." />}>
//         <UserStatsGrid stats={userStats} loading={userStatsLoading} />
//       </Suspense>
//     </div>
//   );
// }

// src/pages/User/Dashboard/Dashboard.jsx
import { Suspense, lazy, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../../../context/AuthContext";
import { useAppStore } from "../../../store/store";
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../../firebase';
import useStats from "../../../hooks/useStats";
import useUserStats from "../../../hooks/useUserStats";
import Loading from "../../../components/GeneralComponents/Loading/Loading";
import StoreIntro from "../../../components/UserComponents/StoreIntro/StoreIntro";
import CatalogList from "../../../components/Generic/CatalogList/CatalogList";
import VisaCard from '../../../components/GeneralComponents/VisaCard/VisaCard'; // ✅ إضافة VisaCard
import './Dashboard.css';

// Lazy imports
const HowItWorks = lazy(() => import("../../../components/UserComponents/HowItWorks/HowItWorks"));
const AdSpace = lazy(() => import("../../../components/UserComponents/AdSpace/AdSpace"));
const UserStatsGrid = lazy(() => import("../../../components/UserComponents/UserStatsGrid/UserStatsGrid"));
const ServicesGrid = lazy(() => import("../../../components/UserComponents/ServicesGrid/ServicesGrid"));
const OrdersList = lazy(() => import("../../../components/UserComponents/OrdersList/OrdersList"));
const SpendingProgress = lazy(() => import("../../../components/UserComponents/SpendingProgress/SpendingProgress"));

// ✅ لم نعد نحتاج BalanceDisplay و TopUpButton، يمكن إزالة استيرادهما أو تعليقهما
// const BalanceDisplay = lazy(() => import('../../../components/GeneralComponents/BalanceDisplay/BalanceDisplay'));
// const TopUpButton = lazy(() => import('../../../components/GeneralComponents/TopUpButton/TopUpButton'));

export default function Dashboard() {
  const { userData } = useAuth();
  const balance = useAppStore((state) => state.balance); // ✅ نحتاج الرصيد من الـ store
  const { stats, loading: statsLoading } = useStats();
  const { stats: userStats, loading: userStatsLoading } = useUserStats();
  const navigate = useNavigate();

  // ===== الألعاب =====
  const { games, setGames } = useAppStore();
  const [gamesLoading, setGamesLoading] = useState(!games || games.length === 0);
  const [gamesToDisplay, setGamesToDisplay] = useState([]);

  useEffect(() => {
    const fetchGames = async () => {
      if (games && games.length > 0) {
        setGamesToDisplay(games.slice(0, 6));
        setGamesLoading(false);
        return;
      }
      setGamesLoading(true);
      try {
        const q = query(collection(db, 'games'), orderBy('order', 'asc'));
        const snapshot = await getDocs(q);
        const gamesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setGames(gamesList);
        setGamesToDisplay(gamesList.slice(0, 6));
      } catch (err) {
        console.error('خطأ في جلب الألعاب:', err);
      } finally {
        setGamesLoading(false);
      }
    };
    fetchGames();
  }, [games, setGames]);

  const handleGameClick = (game) => {
    navigate(`/gaming/game/${game.id}`);
  };

  const handleViewAllGames = () => {
    navigate('/gaming');
  };

  // ===== التطبيقات =====
  const { apps, setApps } = useAppStore();
  const [appsLoading, setAppsLoading] = useState(!apps || apps.length === 0);
  const [appsToDisplay, setAppsToDisplay] = useState([]);

  useEffect(() => {
    const fetchApps = async () => {
      if (apps && apps.length > 0) {
        setAppsToDisplay(apps.slice(0, 6));
        setAppsLoading(false);
        return;
      }
      setAppsLoading(true);
      try {
        const q = query(collection(db, 'apps'), orderBy('order', 'asc'));
        const snapshot = await getDocs(q);
        const appsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setApps(appsList);
        setAppsToDisplay(appsList.slice(0, 6));
      } catch (err) {
        console.error('خطأ في جلب التطبيقات:', err);
      } finally {
        setAppsLoading(false);
      }
    };
    fetchApps();
  }, [apps, setApps]);

  const handleAppClick = (app) => {
    navigate(`/apps/app/${app.id}`);
  };

  const handleViewAllApps = () => {
    navigate('/apps');
  };

  if (statsLoading) return <Loading />;

  return (
    <div className="dashboard" dir="rtl">
      {/* صف الرصيد والإعلانات - تم استبدال BalanceDisplay و TopUpButton بـ VisaCard */}
      <Suspense fallback={<Loading text="جاري تحميل الإعلانات..." />}>
        <AdSpace />
      </Suspense>
      
      {/* ✅ بطاقة الفيزا الجديدة - تحل مكان الرصيد وزر الإيداع */}
      <div className="dashboard__visa-wrapper">
        <VisaCard 
          balance={balance} 
          cardHolderName={userData?.name || 'MarsGo User'}
          cardNumber="8888 8888 8888 8888"
          brand="MarsGo Visa"
        />
      </div>

      {/* يمكن الاحتفاظ بـ SpendingProgress إذا أردت، أو إزالته */}
      {/* <SpendingProgress /> */}

      {/* ===== قسم الألعاب ===== */}
      <div className="dashboard__hot-games-section">
        <div className="dashboard__hot-games-header">
          <div>
            <h2> الألعاب الأكثر مبيعاً</h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
              آمنة وبأسعار مناسبة دائماً
            </p>
          </div>
        </div>
        {gamesLoading ? (
          <div className="loading-wrapper">جاري تحميل الألعاب...</div>
        ) : (
          <>
            <CatalogList
              items={gamesToDisplay}
              onItemClick={handleGameClick}
              showPrice={true}
              type="game"
              showBackButton={false}
              title=""
            />
            <div className="dashboard__hot-games-footer">
              <span className="view-more-link" onClick={handleViewAllGames}>
                المزيد <span className="arrow">›</span>
              </span>
            </div>
          </>
        )}
      </div>

      {/* ===== قسم التطبيقات ===== */}
      <div className="dashboard__hot-apps-section">
        <div className="dashboard__hot-apps-header">
          <div>
            <h2> التطبيقات الأكثر مبيعاً</h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
              تطبيقات متنوعة بأسعار تنافسية
            </p>
          </div>
        </div>
        {appsLoading ? (
          <div className="loading-wrapper">جاري تحميل التطبيقات...</div>
        ) : (
          <>
            <CatalogList
              items={appsToDisplay}
              onItemClick={handleAppClick}
              showPrice={true}
              type="app"
              showBackButton={false}
              title=""
            />
            <div className="dashboard__hot-games-footer">
              <span className="view-more-link" onClick={handleViewAllApps}>
                المزيد <span className="arrow">›</span>
              </span>
            </div>
          </>
        )}
      </div>
      
      <StoreIntro />
      
      {/* باقي المحتوى */}
      <div className="dashboard__services">
        <h3 className="dashboard__services-title">خدماتنا الرقمية</h3>
        <Suspense fallback={<Loading text="جاري تحميل الخدمات..." />}>
          <ServicesGrid />
        </Suspense>
      </div>

      <h3 className="dashboard__services-title">إحصائيات المستخدم</h3>
      <Suspense fallback={<Loading text="جاري تحميل الإحصائيات..." />}>
        <UserStatsGrid stats={userStats} loading={userStatsLoading} />
      </Suspense>
    </div>
  );
}