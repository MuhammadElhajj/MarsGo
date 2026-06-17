// src/components/UserComponents/Chat/Message.jsx
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import './Message.css';

export default function Message({ message, isOwn }) {
  const {
    displayName = 'مجهول',
    photoURL = null,
    text = '',
    timestamp,
    popularity = 0,
    power = 0,
    rank = 'عضو',
  } = message;

  // تنسيق الوقت
  const timeAgo = timestamp
    ? formatDistanceToNow(timestamp.toDate(), { addSuffix: true, locale: ar })
    : 'الآن';

  // الحرف الأول من الاسم للـ Avatar
  const initial = displayName?.charAt(0) || 'م';

  return (
    <div className={`message ${isOwn ? 'message--own' : 'message--other'}`}>
      <div className="message__avatar">
        {photoURL ? (
          <img src={photoURL} alt={displayName} className="message__avatar-img" />
        ) : (
          <div className="message__avatar-placeholder">{initial}</div>
        )}
      </div>

      <div className="message__content">
        <div className="message__header">
          <span className="message__name">{displayName}</span>
          <span className="message__rank">[{rank}]</span>
          <span className="message__badges">
            <span className="message__badge" title="الشعبية">❤️ {popularity}</span>
            <span className="message__badge" title="القوة">⚡ {power}</span>
          </span>
          <span className="message__time">{timeAgo}</span>
        </div>

        <div className="message__text">{text}</div>
      </div>
    </div>
  );
}