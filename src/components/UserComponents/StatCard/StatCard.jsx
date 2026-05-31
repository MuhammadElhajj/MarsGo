import './StatCard.css';

export default function StatCard({ title, value, colorClass = 'accent' }) {
  // قائمة الألوان المدعومة (اختياري لمنع أخطاء CSS)
  const validColors = ['accent', 'blue', 'yellow', 'green', 'red', 'orange', 'purple'];
  const finalColor = validColors.includes(colorClass) ? colorClass : 'accent';

  return (
    <div className={`stat-card stat-card--${finalColor}`}>
      <h3 className="stat-title">{title}</h3>
      <p className="stat-value">{value}</p>
    </div>
  );
}