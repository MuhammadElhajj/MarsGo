import { useEffect, useState } from 'react';
import { useAppStore } from '../../../store/store';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import styles from './FriendRequestsTab.module.css';

const FriendRequestsTab = () => {
  const { friendRequests, acceptFriendRequest, rejectFriendRequest, fetchFriendRequests } = useAppStore();
  const [requestUsers, setRequestUsers] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFriendRequests(); // تحديث القائمة عند فتح التبويب
  }, []);

  useEffect(() => {
    const loadUsers = async () => {
      const usersData = {};
      for (let req of friendRequests) {
        if (!requestUsers[req.from]) {
          try {
            const userSnap = await getDoc(doc(db, 'users', req.from));
            if (userSnap.exists()) {
              usersData[req.from] = userSnap.data();
            }
          } catch (err) {
            console.error('خطأ جلب بيانات المرسل:', err);
          }
        }
      }
      setRequestUsers(prev => ({ ...prev, ...usersData }));
    };
    if (friendRequests.length > 0) loadUsers();
  }, [friendRequests]);

  const handleAccept = async (requestId, fromUserId, fromUserName) => {
    setLoading(true);
    await acceptFriendRequest(requestId, fromUserId, fromUserName);
    setLoading(false);
  };

  const handleReject = async (requestId) => {
    setLoading(true);
    await rejectFriendRequest(requestId);
    setLoading(false);
  };

  if (friendRequests.length === 0) {
    return <p className={styles.empty}>لا توجد طلبات صداقة حالياً</p>;
  }

  return (
    <div className={styles.container}>
      {friendRequests.map((req) => {
        const sender = requestUsers[req.from] || {};
        const name = sender.name || sender.displayName || 'مستخدم';
        const avatar = sender.avatar || sender.photoURL;
        const level = sender.level || 1;
        const title = sender.title || 'مبتدئ';

        return (
          <div key={req.id} className={styles.requestItem}>
            <div className={styles.userInfo}>
              <img
                src={avatar || '/default-avatar.png'}
                alt={name}
                className={styles.avatar}
              />
              <div>
                <div className={styles.name}>{name}</div>
                <div className={styles.level}>
                  Lv.{level} – {title}
                </div>
              </div>
            </div>
            <div className={styles.actions}>
              <button
                className={styles.acceptBtn}
                onClick={() => handleAccept(req.id, req.from, name)}
                disabled={loading}
              >
                قبول
              </button>
              <button
                className={styles.rejectBtn}
                onClick={() => handleReject(req.id)}
                disabled={loading}
              >
                رفض
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FriendRequestsTab;