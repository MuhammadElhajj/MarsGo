// src/components/UserComponents/Chat/Message.jsx
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import './Message.css';

// ===== جدول ألقاب المستويات (مطابق لما في store.js) =====
const LEVEL_TITLES = {
  1: 'مبتدئ',
  2: 'مستكشف',
  3: 'مغامر',
  4: 'الشاطر',
  5: 'بطل',
  6: 'أسطورة',
  7: 'محارب',
  8: 'الحاج',
  9: 'سيد',
  10: 'ملكي',
};

function getLevelTitle(level) {
  return LEVEL_TITLES[level] || LEVEL_TITLES[1];
}

export default function Message({ message, isOwn }) {
  const navigate = useNavigate();
  const {
    uid,
    displayName = 'مجهول',
    photoURL = null,
    text = '',
    timestamp,
    rank = 'عضو',
    title = null,
    level = 1,
  } = message;

  const timeAgo = timestamp
    ? formatDistanceToNow(timestamp.toDate(), { addSuffix: true, locale: ar })
    : 'الآن';

  const initial = displayName?.charAt(0) || 'م';
  // استخدام اسم المستوى من الجدول بدلاً من "المستوى X"
  const levelName = getLevelTitle(level);

  const handleAvatarClick = () => {
    if (uid && !isOwn) {
      navigate(`/profile/${uid}`);
    }
  };

  return (
    <div className={`message ${isOwn ? 'message--own' : 'message--other'}`}>
      {/* الأفاتار */}
      <div 
        className="message__avatar"
        onClick={handleAvatarClick}
        style={{ cursor: isOwn ? 'default' : 'pointer' }}
      >
        {photoURL ? (
          <img src={photoURL} alt={displayName} className="message__avatar-img" />
        ) : (
          <div className="message__avatar-placeholder">{initial}</div>
        )}
      </div>

      <div className="message__content">
        {/* رأس الرسالة: الاسم + اللقب + الرتبة + المستوى */}
        <div className={`message__header ${isOwn ? 'message__header--own' : 'message__header--other'}`}>
          <div className="message__user-info">
            <span className="message__name">{displayName}</span>
            {title && (
              <span className="message__title-badge">
                🏅 {title}
              </span>
            )}
            <span className="message__rank">{rank}</span>
            <span className="message__level">{levelName}</span>
          </div>
        </div>

        {/* فقاعة النص مع الزمن في الأسفل */}
        <div className="message__bubble-wrapper">
          <div className={`message__bubble ${isOwn ? 'message__bubble--own' : 'message__bubble--other'}`}>
            <div className="message__text">{text}</div>
          </div>
            <div className={`message__time ${isOwn ? 'message__time--own' : 'message__time--other'}`}>
              {timeAgo}
            </div>
        </div>
      </div>
    </div>
  );
}