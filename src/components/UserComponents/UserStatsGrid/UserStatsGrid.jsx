import StatCard from "../StatCard/StatCard";
import "./UserStatsGrid.css";

export default function UserStatsGrid({ stats, loading }) {
  if (loading) {
    return <div className="user-stats-loading">جاري تحميل إحصائياتك...</div>;
  }

  return (
    <div className="user-stats-grid">
      <StatCard title="قيد التدقيق" value={stats.pendingVerification} colorClass="yellow" />
      <StatCard title="بانتظار تعديلك" value={stats.awaitingResubmit} colorClass="orange" />
      <StatCard title="تم التدقيق - بانتظار التنفيذ" value={stats.verifiedPendingExecution} colorClass="blue" />
      <StatCard title="مكتمل" value={stats.completed} colorClass="green" />
      <StatCard title="مرفوض" value={stats.rejected} colorClass="red" />
      <StatCard title="إجمالي طلباتي" value={stats.total} colorClass="accent" />
    </div>
  );
}