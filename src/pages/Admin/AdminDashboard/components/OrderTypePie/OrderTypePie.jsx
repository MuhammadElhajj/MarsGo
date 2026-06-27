// src/pages/Admin/AdminDashboard/components/OrderTypePie/OrderTypePie.jsx
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { CHART_COLORS } from '../../utils/constants';

export default function OrderTypePie({ data }) {
  const filteredData = data.filter((d) => d.value > 0);
  if (filteredData.length === 0) {
    return <p className="admin-dashboard__chart-empty">لا توجد بيانات كافية</p>;
  }

  return (
    <div className="admin-dashboard__chart-card">
      <div className="admin-dashboard__chart-header">
        <h3>📦 توزيع الطلبات حسب النوع</h3>
      </div>
      <div className="admin-dashboard__chart-body admin-dashboard__chart-body--pie">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={filteredData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name, percent }) =>
                `${name} (${(percent * 100).toFixed(0)}%)`
              }
            >
              {filteredData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}