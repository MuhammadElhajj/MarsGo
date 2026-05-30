import { useAuth } from "../../../context/AuthContext";
import useStats from "../../../hooks/useStats";
import StatCard from "../../../components/UserComponents/StatCard/StatCard";
import StoreIntro from "../../../components/UserComponents/StoreIntro/StoreIntro";
import AdSpace from "../../../components/UserComponents/AdSpace/AdSpace";
import Loading from "../../../components/GeneralComponents/Loading/Loading";
import './Dashboard.css';

export default function Dashboard() {
  const { userData } = useAuth();
  const { stats, loading } = useStats();

  if (loading) return <Loading />;

  return (
    <div className="dashboard" dir="rtl">
   
      {/* لمحة عن المتجر */}
      <StoreIntro />

      {/* مساحة إعلانية */}
      <AdSpace />

      {/* بطاقات الإحصائيات */}
      <div className="dashboard__cards">
        <StatCard title="إجمالي المستخدمين" value={stats.users} colorClass="accent" />
        <StatCard title="إجمالي الطلبات" value={stats.orders} colorClass="blue" />
        <StatCard title="الطلبات المعلقة" value={stats.pendingOrders} colorClass="yellow" />
        <StatCard title="الطلبات المنجزة اليوم" value={stats.completedToday} colorClass="green" />
      </div>
    </div>
  );
}