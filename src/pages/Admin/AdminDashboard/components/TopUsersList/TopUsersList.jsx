// src/pages/Admin/AdminDashboard/components/TopUsersList/TopUsersList.jsx
import { CHART_COLORS } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatters';

export default function TopUsersList({ topUsers }) {
  if (!topUsers || topUsers.length === 0) {
    return <p className="admin-dashboard__chart-empty">لا توجد بيانات كافية</p>;
  }

  return (
    <div className="admin-dashboard__chart-card admin-dashboard__chart-card--full">
      <div className="admin-dashboard__chart-header">
        <h3>🏆 أهم المستخدمين (الأكثر طلبات)</h3>
      </div>
      <div className="admin-dashboard__top-users">
        <div className="admin-dashboard__top-users-list">
          {topUsers.map((user, index) => (
            <div key={user.id} className="admin-dashboard__top-user">
              <span className="admin-dashboard__top-user-rank">#{index + 1}</span>
              <span className="admin-dashboard__top-user-name">{user.name}</span>
              <div className="admin-dashboard__top-user-bar">
                <div
                  className="admin-dashboard__top-user-fill"
                  style={{
                    width: `${(user.orders / topUsers[0].orders) * 100}%`,
                    background: CHART_COLORS[index % CHART_COLORS.length],
                  }}
                />
              </div>
              <span className="admin-dashboard__top-user-count">{user.orders} طلب</span>
              <span className="admin-dashboard__top-user-total">{formatCurrency(user.total)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}