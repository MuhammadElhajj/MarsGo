import { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useStoreSettings } from '../../../context/StoreSettingsContext';
import { collection, getCountFromServer, query, where } from 'firebase/firestore';
import { db } from '../../../firebase';
import './StoreIntro.css';

export default function StoreIntro() {
  const { userData } = useAuth();
  const { settings: storeSettings } = useStoreSettings(); // جلب إعدادات المتجر
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

  // تحديد الخلفية: إما الصورة المرفوعة من Storage (imageUrl) أو القديمة (base64) أو لون افتراضي
  const backgroundImage = storeSettings?.backgroundImageUrl || storeSettings?.backgroundImageBase64;
  const bgStyle = backgroundImage
    ? { backgroundImage: `url(${backgroundImage})` }
    : { backgroundColor: 'var(--color-accent)' };

  return (
    <div className="store-intro" style={bgStyle} dir="rtl">
      <div className="store-intro__overlay"></div> {/* الطبقة العاتمة */}
      <div className="store-intro__content">
        <h2 className="store-intro__title">مرحباً بك {userData?.name || 'مستخدم'} في MarsGo</h2>
        {/* <h2 className="store-intro__title">مرحباً بك {userData?.name || 'مستخدم'} </h2> */}
        <p className="store-intro__description">
          مارسغو منصتك الرقمية الأولى للخدمات المالية  في سوريا. تحويل أموال، شحن ألعاب، بطاقات رقمية، 
          وتداول العملات الرقمية بأمان وسرعة عبر نظام شام كاش.
        </p>
        {/* <div className="store-intro__highlights">
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
        </div> */}
      </div>
      {/* <div className="store-intro__stats-mini">
        <span className="store-intro__stat">+{realStats.users} مستخدم</span>
        <span className="store-intro__stat">+{realStats.completed} عملية ناجحة</span>
      </div> */}
      <div className="store-intro__stats-mini">
        <span className="store-intro__stat">+348 مستخدم</span>
        <span className="store-intro__stat">+1721 عملية ناجحة</span>
      </div>
    </div>
  );
}