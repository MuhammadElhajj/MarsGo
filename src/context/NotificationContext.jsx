import { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc, getDocs } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export function useNotifications() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
  const { user, userData } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // إضافة إشعار جديد (يستخدمها المدقق أو المدير عند تغيير حالة الطلب)
  const addNotification = async (userId, title, message, type, orderId = null, link = null) => {
    if (!userId) return;
    try {
      await addDoc(collection(db, 'notifications'), {
        userId,
        title,
        message,
        type, // 'order_created', 'order_verified', 'order_completed', 'order_rejected', 'order_resubmit'
        orderId,
        link: link || (orderId ? `/my-orders` : null),
        read: false,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error('خطأ في إضافة الإشعار:', error);
    }
  };

  // وضع علامة مقروءة على إشعار واحد
  const markAsRead = async (notificationId) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), { read: true });
    } catch (error) {
      console.error('خطأ في تحديث الإشعار:', error);
    }
  };

  // وضع علامة مقروءة على جميع إشعارات المستخدم
  const markAllAsRead = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'notifications'), where('userId', '==', user.uid), where('read', '==', false));
      const snapshot = await getDocs(q);
      const batch = snapshot.docs.map(doc => updateDoc(doc.ref, { read: true }));
      await Promise.all(batch);
    } catch (error) {
      console.error('خطأ في تحديث جميع الإشعارات:', error);
    }
  };

  // الاستماع للإشعارات في الوقت الفعلي
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(notifs);
      const unread = notifs.filter(n => !n.read).length;
      setUnreadCount(unread);
      setLoading(false);
    }, (error) => {
      console.error('خطأ في الاستماع للإشعارات:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      addNotification,
      markAsRead,
      markAllAsRead,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}