import { useEffect, useState } from 'react';
import { collection, getCountFromServer, query, where } from 'firebase/firestore';
import { db } from '../../../firebase';
import GoBackButton from '../../../components/GeneralComponents/GoBackButton/GoBackButton';
import './AboutPage.css';

export default function AboutPage() {
  const [stats, setStats] = useState({ users: 0, completedOrders: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const usersSnap = await getCountFromServer(collection(db, 'users'));
        const completedQuery = query(collection(db, 'orders'), where('status', '==', 'completed'));
        const completedSnap = await getCountFromServer(completedQuery);
        setStats({
          users: usersSnap.data().count,
          completedOrders: completedSnap.data().count,
        });
      } catch (error) {
        console.error('خطأ في جلب الإحصائيات:', error);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="about-page" dir="rtl">
      {/* زر الرجوع */}
      <div style={{ marginBottom: '1rem' }}>
        <GoBackButton text="رجوع إلى لوحة التحكم" />
      </div>

      {/* القسم البطولي */}
      <div className="about-hero">
        <h1>منصة MarsGo</h1>
        <p>حلول مالية رقمية متكاملة في سوريا - آمنة، سريعة، وموثوقة</p>
      </div>

      {/* نبذة شاملة عن المنصة */}
      <div className="about-narrative">
        <div className="narrative-card">
          <h2>نبذة عنا</h2>
          <p>
            <strong>MarsGo</strong> هي منصة سورية متخصصة في الخدمات المالية والرقمية، تأسست بهدف تمكين الأفراد والشباب من الوصول إلى حلول تحويل الأموال، شحن الألعاب، تداول العملات الرقمية، وصرافة شام كاش بكل سهولة وأمان.
          </p>
          <p>
            نعتمد على نظام متكامل من التدقيق والتحقق (KYC) لضمان حماية جميع المعاملات، وندعم الدفع عبر شام كاش، التحويلات الداخلية، وبطاقات الدفع الرقمية. كما نعمل باستمرار على تطوير خدماتنا لتشمل المزيد من الخيارات المبتكرة.
          </p>
          <p>
            منذ انطلاقتنا، استطعنا بناء مجتمع من آلاف المستخدمين الذين يثقون بنا، وأنجزنا آلاف الطلبات بنجاح بفضل فريقنا المحترف من المدققين والإداريين.
          </p>
        </div>
      </div>

      {/* إحصائيات ديناميكية */}
      <div className="about-stats">
        <h3>إنجازاتنا حتى اليوم</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-number">{stats.users}+</span>
            <span className="stat-label">مستخدم نشط</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.completedOrders}+</span>
            <span className="stat-label">عملية ناجحة</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">4</span>
            <span className="stat-label">خدمات رئيسية</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">24/7</span>
            <span className="stat-label">دعم متواصل</span>
          </div>
        </div>
      </div>

      {/* خدماتنا الأساسية */}
      <div className="about-services">
        <h2>خدماتنا الرقمية</h2>
        <div className="services-grid">
          <div className="service-item">
            <div className="service-icon">💸</div>
            <h3>تحويل شام كاش</h3>
            <p>حوّل الأموال محلياً بسرعة وأمان عبر شبكة شام كاش.</p>
          </div>
          <div className="service-item">
            <div className="service-icon">🎮</div>
            <h3>شحن الألعاب</h3>
            <p>شحن جميع الألعاب الإلكترونية (ببجي، فري فاير، موبايل ليجند).</p>
          </div>
          <div className="service-item">
            <div className="service-icon">₿</div>
            <h3>العملات الرقمية</h3>
            <p>شراء وبيع USDT وغيرها من العملات الرقمية بسعر تنافسي.</p>
          </div>
          <div className="service-item">
            <div className="service-icon">🔄</div>
            <h3>صرافة شام كاش</h3>
            <p>تحويل بين الليرة السورية والدولار واليورو عبر شام كاش.</p>
          </div>
          <div className="service-item">
            <div className="service-icon">🔐</div>
            <h3>تحقق أمني (KYC)</h3>
            <p>نظام تدقيق متكامل لحماية جميع الأطراف.</p>
          </div>
          <div className="service-item">
            <div className="service-icon">📱</div>
            <h3>دعم فوري</h3>
            <p>فريق دعم على مدار الساعة لحل أي استفسار.</p>
          </div>
        </div>
      </div>

      {/* قسم الاتصال */}
      <div className="about-contact">
        <h3>تواصل معنا</h3>
        <div className="contact-details">
          <p>📧 support@marsgo.sy</p>
          <p>📞 +963 123 456 789</p>
          <p>📍 سوريا - دمشق</p>
        </div>
        <p style={{ marginTop: '1rem', fontSize: '0.8rem', opacity: 0.8 }}>
          نحن هنا لمساعدتك على مدار الساعة
        </p>
      </div>
    </div>
  );
}