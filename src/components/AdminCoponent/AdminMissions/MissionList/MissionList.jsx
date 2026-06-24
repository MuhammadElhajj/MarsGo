// src/components/AdminCoponent/AdminMissions/MissionList/MissionList.jsx
import MissionCard from '../MissionCard/MissionCard';
import './MissionList.css';

export default function MissionList({ missions, loading, onEdit, onDelete, onToggleActive }) {
  if (loading) {
    return <div className="mission-list__loading">جاري تحميل المهام...</div>;
  }

  if (missions.length === 0) {
    return <div className="mission-list__empty">لا توجد مهام مضافة حتى الآن</div>;
  }

  return (
    <div className="mission-list">
      <div className="mission-list__header">
        <span className="mission-list__col mission-list__col--order">الترتيب</span>
        <span className="mission-list__col mission-list__col--icon">الأيقونة</span>
        <span className="mission-list__col mission-list__col--name">الاسم</span>
        <span className="mission-list__col mission-list__col--description">الوصف</span>
        <span className="mission-list__col mission-list__col--duration">المدة</span>
        <span className="mission-list__col mission-list__col--target">الهدف</span>
        <span className="mission-list__col mission-list__col--reward">المكافأة</span>
        <span className="mission-list__col mission-list__col--status">الحالة</span>
        <span className="mission-list__col mission-list__col--actions">الإجراءات</span>
      </div>
      {missions.map((mission) => (
        <MissionCard
          key={mission.id}
          mission={mission}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleActive={onToggleActive}
        />
      ))}
    </div>
  );
}