import { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { collection, getCountFromServer, query, where } from 'firebase/firestore';
import { db } from '../../../firebase';
import './StoreIntro.css';

export default function StoreIntro() {
  const { userData } = useAuth();
  const [realStats, setRealStats] = useState({ users: 0, completed: 0 });

  useEffect(() => {
    const fetchRealStats = async () => {
      try {
        const usersSnap = await getCountFromServer(collection(db, 'users'));
        const completedQuery = query(collection(db, 'orders'), where('status', '==', 'completed'));
        const completedSnap = await getCountFromServer(completedQuery);

        setRealStats({
          users: usersSnap.data().count,
          completed: completedSnap.data().count,
        });
      } catch (error) {
        console.error('خطأ في جلب الإحصائيات:', error);
      }
    };

    fetchRealStats();
  }, []);

  return (
    <div className="store-intro" dir="rtl">
      <div className="store-intro__content">
        <h2 className="store-intro__title">مرحباً بك {userData?.name || 'مستخدم'} في MarsGo</h2>
        <p className="store-intro__description">
          منصتك الأولى للخدمات المالية الرقمية في سوريا. تحويل أموال، شحن ألعاب، بطاقات رقمية،
          وتداول العملات الرقمية بأمان وسرعة عبر نظام شام كاش.
        </p>
        <div className="store-intro__highlights">
          <div className="store-intro__highlight-item">
            <span className="store-intro__icon">⚡</span>
            <span>تحويل سريع وآمن</span>
          </div>
          <div className="store-intro__highlight-item">
            <span className="store-intro__icon">🎮</span>
            <span>شحن جميع الألعاب</span>
          </div>
          <div className="store-intro__highlight-item">
            <span className="store-intro__icon">💱</span>
            <span>صرافة شام كاش</span>
          </div>
          <div className="store-intro__highlight-item">
            <span className="store-intro__icon">₿</span>
            <span>عملات رقمية قريباً</span>
          </div>
        </div>
      </div>
      <div className="store-intro__stats-mini">
        <span className="store-intro__stat">+{realStats.users} مستخدم</span>
        <span className="store-intro__stat">+{realStats.completed} عملية ناجحة</span>
      </div>
    </div>
  );
}