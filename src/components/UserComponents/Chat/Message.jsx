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

  const timeAgo = timestamp
    ? formatDistanceToNow(timestamp.toDate(), { addSuffix: true, locale: ar })
    : 'الآن';

  const initial = displayName?.charAt(0) || 'م';

  return (
    <div className={`message ${isOwn ? 'message--own' : 'message--other'}`}>
      {/* صورة الأفاتار */}
      <div className="message__avatar">
        {photoURL ? (
          <img src={photoURL} alt={displayName} className="message__avatar-img" />
        ) : (
          <div className="message__avatar-placeholder">{initial}</div>
        )}
      </div>

      <div className="message__content">
        {/* رأس الرسالة: الاسم + اللقب + الشارات */}
        <div className="message__header">
          <span className="message__name">{displayName}</span>
          <span className="message__rank">{rank}</span>
          <span className="message__badges">
            <span className="message__badge" title="الشعبية">❤️ {popularity}</span>
            <span className="message__badge" title="القوة">⚡ {power}</span>
          </span>
          <span className="message__time">{timeAgo}</span>
        </div>

        {/* فقاعة النص (مثل واتساب) */}
        <div className="message__bubble">
          <div className="message__text">{text}</div>
        </div>
      </div>
    </div>
  );
}