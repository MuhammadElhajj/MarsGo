// src/components/AdminCoponent/AdminMissions/MissionCard/MissionCard.jsx
import { FiEdit, FiTrash2, FiToggleLeft, FiToggleRight, FiClock } from 'react-icons/fi';
import Button from '../../../GeneralComponents/Button/Button';
import './MissionCard.css';

// خريطة الأيقونات للعرض
const iconMap = {
  FiAward: '🏆', FiZap: '⚡', FiUsers: '👥', FiDollarSign: '💰',
  FiShoppingCart: '🛒', FiStar: '⭐', FiHeart: '❤️', FiBox: '📦',
  FiCheckCircle: '✅', FiClock: '⏰', FiGift: '🎁', FiCalendar: '📅',
  FiTarget: '🎯'
};

// تسميات المدة الزمنية
const durationLabels = {
  daily: 'يومية',
  weekly: 'أسبوعية',
  biweekly: 'أسبوعين',
  ten_days: '10 أيام',
  monthly: 'شهرية',
};

// تسميات العضويات
const membershipLabels = {
  adventurer: 'مغامر',
  marsgo: 'مارسغو',
  master: 'المعلم',
  legendary: 'الحاج الأسطوري',
};

export default function MissionCard({ mission, onEdit, onDelete, onToggleActive }) {
  const iconEmoji = iconMap[mission.icon] || '📌';
  const durationLabel = durationLabels[mission.duration] || mission.duration || 'أسبوعية';

  return (
    <div className={`mission-card ${!mission.isActive ? 'mission-card--inactive' : ''}`}>
      <div className="mission-card__order">{mission.order || 0}</div>
      <div className="mission-card__icon">{iconEmoji}</div>
      <div className="mission-card__name">{mission.label}</div>
      <div className="mission-card__description">{mission.description}</div>
      <div className="mission-card__duration">
        <FiClock className="duration-icon" />
        <span>{durationLabel}</span>
        <small>({mission.durationDays || 7} يوم)</small>
      </div>
      <div className="mission-card__target">{mission.target}</div>
      <div className="mission-card__reward">{mission.reward} MGC</div>
      <div className="mission-card__status">
        <button
          className={`status-toggle ${mission.isActive ? 'active' : 'inactive'}`}
          onClick={() => onToggleActive(mission.id, mission.isActive)}
          title={mission.isActive ? 'تعطيل' : 'تفعيل'}
        >
          {mission.isActive ? <FiToggleRight /> : <FiToggleLeft />}
          <span>{mission.isActive ? 'نشط' : 'غير نشط'}</span>
        </button>
        {mission.membershipRequired && (
          <span className="membership-badge">
            {membershipLabels[mission.membershipRequired] || mission.membershipRequired}
          </span>
        )}
      </div>
      <div className="mission-card__actions">
        <Button onClick={() => onEdit(mission)} variant="primary" size="sm">
          <FiEdit /> تعديل
        </Button>
        <Button onClick={() => onDelete(mission.id)} variant="danger" size="sm">
          <FiTrash2 /> حذف
        </Button>
      </div>
    </div>
  );
}