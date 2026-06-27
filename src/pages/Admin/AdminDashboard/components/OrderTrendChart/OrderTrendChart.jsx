// src/pages/Admin/AdminDashboard/components/OrderTrendChart/OrderTrendChart.jsx
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { COLORS } from '../../utils/constants';

export default function OrderTrendChart({ data }) {
  if (!data || data.length === 0) {
    return <p className="admin-dashboard__chart-empty">لا توجد بيانات كافية</p>;
  }

  return (
    <div className="admin-dashboard__chart-card admin-dashboard__chart-card--full">
      <div className="admin-dashboard__chart-header">
        <h3>📈 اتجاه الطلبات (آخر 7 أيام)</h3>
      </div>
      <div className="admin-dashboard__chart-body">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data}>
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
            <Legend />
            <Bar dataKey="completed" name="مكتمل" fill={COLORS.success} />
            <Bar dataKey="pending" name="معلق" fill={COLORS.warning} />
            <Bar dataKey="rejected" name="مرفوض" fill={COLORS.danger} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}