import { useEffect } from 'react';
import { useAppStore } from '../../../store/store';
import { useNavigate } from 'react-router-dom';
import styles from './FriendsListTab.module.css';

const FriendsListTab = () => {
  const { friendsList, fetchFriendsList, removeFriend } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchFriendsList();
  }, []);

  const handleRemove = async (friendId) => {
    if (window.confirm('هل أنت متأكد من إزالة هذا الصديق؟')) {
      await removeFriend(friendId);
    }
  };

  const handleChat = (friendId, friendName) => {
    // الانتقال إلى الدردشة الخاصة (نفترض وجود صفحة دردشة)
    // يمكنك تعديلها حسب نظام الدردشة لديك
    navigate(`/chat/private/${friendId}`, { state: { friendName } });
  };

  if (friendsList.length === 0) {
    return <p className={styles.empty}>لا يوجد أصدقاء حتى الآن</p>;
  }

  return (
    <div className={styles.container}>
      {friendsList.map((friend) => {
        const name = friend.name || friend.displayName || 'مستخدم';
        const avatar = friend.avatar || friend.photoURL || '/default-avatar.png';
        const level = friend.level || 1;
        const title = friend.title || 'مبتدئ';
        const isOnline = friend.isOnline || false; // إن كنت ستضيف خاصية الاتصال

        return (
          <div key={friend.id} className={styles.friendItem}>
            <div className={styles.userInfo}>
              <div className={styles.avatarWrapper}>
                <img src={avatar} alt={name} className={styles.avatar} />
                {isOnline && <span className={styles.onlineDot} />}
              </div>
              <div>
                <div className={styles.name}>{name}</div>
                <div className={styles.level}>
                  Lv.{level} – {title}
                </div>
              </div>
            </div>
            <div className={styles.actions}>
              <button
                className={styles.chatBtn}
                onClick={() => handleChat(friend.id, name)}
              >
                مراسلة
              </button>
              <button
                className={styles.removeBtn}
                onClick={() => handleRemove(friend.id)}
              >
                إزالة
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FriendsListTab;