// src/pages/User/MyActivitiesPage/components/SpendingCard/SpendingCard.jsx
import { FiAward } from 'react-icons/fi';

export default function SpendingCard({ totalSpent, currentTier, nextTier, progressPercent }) {
  return (
    <div className="spending-card">
      <div className="spending-header">
        <FiAward className="spending-icon" />
        <span className="spending-title">مستوى الإنفاق</span>
        <span className="spending-level">المستوى {currentTier?.level || 1}</span>
      </div>
      <div className="spending-progress-bar">
        <div className="spending-progress-fill" style={{ width: `${progressPercent}%` }}></div>
      </div>
      <div className="spending-info">
        <span className="spending-total">إجمالي الإنفاق: {totalSpent.toFixed(2)} $</span>
        {nextTier ? (
          <span className="spending-next">الهدف: {nextTier.min} $</span>
        ) : (
          <span className="spending-max">🏆 أعلى مستوى!</span>
        )}
      </div>
    </div>
  );
}