// src/pages/User/Dashboard/Dashboard.jsx
import { Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../../../context/AuthContext";
import useStats from "../../../hooks/useStats";
import useUserStats from "../../../hooks/useUserStats";
import Loading from "../../../components/GeneralComponents/Loading/Loading";
import StoreIntro from "../../../components/UserComponents/StoreIntro/StoreIntro";
import LazyOnScroll from "../../../components/GeneralComponents/LazyOnScroll/LazyOnScroll"; // ✅ المكون الجديد
import './Dashboard.css';

// Lazy imports (باقي المكونات)
const HowItWorks = lazy(() => import("../../../components/UserComponents/HowItWorks/HowItWorks"));
const AdSpace = lazy(() => import("../../../components/UserComponents/AdSpace/AdSpace"));
const UserStatsGrid = lazy(() => import("../../../components/UserComponents/UserStatsGrid/UserStatsGrid"));
const ServicesGrid = lazy(() => import("../../../components/UserComponents/ServicesGrid/ServicesGrid"));
const OrdersList = lazy(() => import("../../../components/UserComponents/OrdersList/OrdersList"));

export default function Dashboard() {
  const { userData } = useAuth();
  const { stats, loading: statsLoading } = useStats();
  const { stats: userStats, loading: userStatsLoading } = useUserStats();
  const navigate = useNavigate();

  const handleViewAllOrders = () => {
    navigate('/my-orders');
  };

  if (statsLoading) return <Loading />;

  return (
    <div className="dashboard" dir="rtl">
      {/* StoreIntro يظهر فوراً بدون تأخير */}
      <StoreIntro />

      {/* ✅ كل مكون من المكونات التالية سيتم تحميله فقط عند التمرير إليه */}
      <LazyOnScroll>
        <HowItWorks page="dashboard" />
      </LazyOnScroll>

      <h3 className="dashboard__services-title">مساحة إعلانية</h3>
      <LazyOnScroll>
        <AdSpace />
      </LazyOnScroll>

      <h3 className="dashboard__services-title">إحصائيات المستخدم</h3>
      <LazyOnScroll>
        <UserStatsGrid stats={userStats} loading={userStatsLoading} />
      </LazyOnScroll>

      <div className="dashboard__services">
        <h3 className="dashboard__services-title">خدماتنا الرقمية</h3>
        <LazyOnScroll>
          <ServicesGrid />
        </LazyOnScroll>
      </div>

      <h3 className="dashboard__services-title">آخر العمليات</h3>
      <LazyOnScroll>
        <OrdersList 
          orderType="all" 
          title="آخر العمليات" 
          limitCount={5} 
          showViewAll={true}
          onViewAll={handleViewAllOrders}
        />
      </LazyOnScroll>
    </div>
  );
}