import { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useAppStore } from '../../../store/store';
import { collection, getCountFromServer, query, where } from 'firebase/firestore';
import { db } from '../../../firebase';
import './StoreIntro.css';

export default function StoreIntro() {
  const { userData } = useAuth();
  const storeSettings = useAppStore((state) => state.storeSettings);
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

  const backgroundImage = storeSettings?.backgroundImageUrl || storeSettings?.backgroundImageBase64;
  // استخدم صورة خلفية عادية (لحين تحميل الصورة الرئيسية)
  const bgStyle = backgroundImage
    ? { backgroundColor: 'var(--color-accent)' } // لون خلفية مؤقت لمنع CLS
    : { backgroundColor: 'var(--color-accent)' };

  return (
    <div className="store-intro" style={bgStyle} dir="rtl">
      {/* ✅ صورة خلفية مع fetchpriority="high" لتحسين LCP */}
      {backgroundImage && (
        <img
          src={backgroundImage}
          alt="خلفية مارسغو"
          className="store-intro__bg-image"
          fetchpriority="high"
          decoding="sync"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0,
          }}
        />
      )}
      <div className="store-intro__overlay"></div>
      <div className="store-intro__content">
        <h2 className="store-intro__title">مرحباً بك {userData?.name || 'مستخدم'} في MarsGo</h2>
        <p className="store-intro__description">
          مارسغو منصتك الرقمية الأولى للخدمات المالية في سوريا. تحويل أموال، شحن ألعاب، بطاقات رقمية، 
          وتداول العملات الرقمية بأمان وسرعة عبر نظام شام كاش.
        </p>
      </div>
      <div className="store-intro__stats-mini">
        <span className="store-intro__stat">+{realStats.users || 348} مستخدم</span>
        <span className="store-intro__stat">+{realStats.completed || 1721} عملية ناجحة</span>
      </div>
    </div>
  );
}