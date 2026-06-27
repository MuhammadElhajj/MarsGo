// src/pages/Admin/AdminDashboard/components/UserGrowthChart/UserGrowthChart.jsx
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { COLORS } from '../../utils/constants';

export default function UserGrowthChart({ data }) {
  if (!data || data.length === 0) {
    return <p className="admin-dashboard__chart-empty">لا توجد بيانات كافية</p>;
  }

  return (
    <div className="admin-dashboard__chart-card admin-dashboard__chart-card--full">
      <div className="admin-dashboard__chart-header">
        <h3>👥 نمو المستخدمين (آخر 7 أيام)</h3>
      </div>
      <div className="admin-dashboard__chart-body">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="day" stroke="var(--color-text-secondary)" />
            <YAxis stroke="var(--color-text-secondary)" />
            <Tooltip
              contentStyle={{
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
              }}
            />
            <Area
              type="monotone"
              dataKey="newUsers"
              name="مستخدمين جدد"
              fill={COLORS.primary}
              stroke={COLORS.primary}
              fillOpacity={0.2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}