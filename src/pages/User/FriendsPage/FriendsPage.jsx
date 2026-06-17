import { useEffect, useState } from 'react';
import { useAppStore } from '../../../store/store';
import FriendRequestsTab from '../../../components/UserComponents/Friends/FriendRequestsTab';
import FriendsListTab from '../../../components/UserComponents/Friends/FriendsListTab';
import styles from './FriendsPage.module.css';

const FriendsPage = () => {
  const { user, fetchFriendRequests, fetchFriendsList, pendingRequestsCount, setPendingCount } = useAppStore();
  const [activeTab, setActiveTab] = useState('requests'); // 'requests' أو 'friends'

  useEffect(() => {
    if (!user) return;
    // جلب الطلبات الواردة وقائمة الأصدقاء عند فتح الصفحة
    fetchFriendRequests();
    fetchFriendsList();

    // عند فتح الصفحة، نعلّم جميع الطلبات كمقروءة (seen = true) لإخفاء الشارة
    const markRequestsAsSeen = async () => {
      try {
        const { collection, query, where, getDocs, writeBatch } = await import('firebase/firestore');
        const { db } = await import('../../../firebase');
        const q = query(
          collection(db, 'friendRequests'),
          where('to', '==', user.uid),
          where('status', '==', 'pending'),
          where('seen', '==', false)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const batch = writeBatch(db);
          snap.docs.forEach(docSnap => batch.update(docSnap.ref, { seen: true }));
          await batch.commit();
          // نحدث العداد في الـ Store بعد التعليم
          useAppStore.getState().setPendingCount(0);
        }
      } catch (err) {
        console.error('فشل تعليم الطلبات كمقروءة:', err);
      }
    };

    markRequestsAsSeen();
  }, [user]);

  // دالة مساعدة لتحديث العداد (موجودة عندك تحتاج إضافتها في الـ Store؟)
  // بما أننا ما أضفنا setPendingCount، ممكن نضيفها كـ Action صغيرة:
  // setPendingCount: (count) => set({ pendingRequestsCount: count })
  // لكن نستخدم حالياً تحديث مباشر عن طريق set في الـ Store لاحقاً
  // (سأضيفها في الرد)

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>الأصدقاء</h2>

      {/* تبويبات */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'requests' ? styles.active : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          الطلبات الواردة
          {pendingRequestsCount > 0 && (
            <span className={styles.badge}>{pendingRequestsCount}</span>
          )}
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'friends' ? styles.active : ''}`}
          onClick={() => setActiveTab('friends')}
        >
          أصدقائي
        </button>
      </div>

      {/* محتوى التبويب */}
      <div className={styles.tabContent}>
        {activeTab === 'requests' ? <FriendRequestsTab /> : <FriendsListTab />}
      </div>
    </div>
  );
};

export default FriendsPage;