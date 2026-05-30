import { useAuth } from "../../../context/AuthContext";
import useStats from "../../../hooks/useStats";
import StatCard from "../../../components/UserComponents/StatCard/StatCard";
import StoreIntro from "../../../components/UserComponents/StoreIntro/StoreIntro";
import AdSpace from "../../../components/UserComponents/AdSpace/AdSpace";
import Loading from "../../../components/GeneralComponents/Loading/Loading";
import './Dashboard.css';
import UserStatsGrid from "../../../components/UserComponents/UserStatsGrid/UserStatsGrid";
import useUserStats from "../../../hooks/useUserStats";
import ServicesGrid from "../../../components/UserComponents/ServicesGrid/ServicesGrid";
export default function Dashboard() {
  const { userData } = useAuth();
  const { stats, loading } = useStats();
  const { stats: userStats, loading: userStatsLoading } = useUserStats();

  if (loading) return <Loading />;

  return (
    <div className="dashboard" dir="rtl">
   
      {/* لمحة عن المتجر */}
      <StoreIntro />

      {/* مساحة إعلانية */}
      <AdSpace />

      {/* بطاقات الإحصائيات */}
      {/* <div className="dashboard__cards"> */}
    <UserStatsGrid stats={userStats} loading={userStatsLoading} /> 
    <div className="dashboard__services">
  <h3 className="dashboard__services-title">خدماتنا الرقمية</h3>
  <ServicesGrid />
</div>
    
    </div>
    // </div>
    
  );
}