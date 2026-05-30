import './StatCard.css';

export default function StatCard({ title, value, colorClass = 'accent' }) {
  return (
    <div className={`stat-card stat-card--${colorClass}`}>
      <h3 className="stat-title">{title}</h3>
      <p className="stat-value">{value}</p>
    </div>
  );
}