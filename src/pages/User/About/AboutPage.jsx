import { useEffect, useState } from 'react';
import { collection, getCountFromServer, query, where } from 'firebase/firestore';
import { db } from '../../../firebase';
import GoBackButton from '../../../components/GeneralComponents/GoBackButton/GoBackButton';
import {
  FiUsers,
  FiCheckCircle,
  FiDollarSign,
  FiPlayCircle,        // ← بدلاً من FiGamepad
  FiBarChart2,         // ← بدلاً من FiBitcoin
  FiRefreshCw,
  FiShield,
  FiPhone,
  FiMail,
  FiMapPin,
  FiClock,
  FiGrid,
  FiMessageCircle,
} from 'react-icons/fi';
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

  const services = [
    { icon: <FiDollarSign />, title: 'تحويل شام كاش', description: 'حوّل الأموال محلياً بسرعة وأمان عبر شبكة شام كاش.' },
    { icon: <FiPlayCircle />, title: 'شحن الألعاب', description: 'شحن جميع الألعاب الإلكترونية (ببجي، فري فاير، موبايل ليجند).' },
    { icon: <FiBarChart2 />, title: 'العملات الرقمية', description: 'شراء وبيع USDT وغيرها من العملات الرقمية بسعر تنافسي.' },
    { icon: <FiRefreshCw />, title: 'صرافة شام كاش', description: 'تحويل بين الليرة السورية والدولار واليورو عبر شام كاش.' },
    { icon: <FiShield />, title: 'تحقق أمني (KYC)', description: 'نظام تدقيق متكامل لحماية جميع الأطراف.' },
    { icon: <FiMessageCircle />, title: 'دعم فوري', description: 'فريق دعم على مدار الساعة لحل أي استفسار.' },
  ];

  return (
    <div className="about-page" dir="rtl">
    

      <div className="about-page__hero">
        <div className="about-page__hero-content">
          <h1 className="about-page__hero-title">منصة MarsGo</h1>
          <p className="about-page__hero-subtitle">
            حلول مالية رقمية متكاملة في سوريا - آمنة، سريعة، وموثوقة
          </p>
        </div>
      </div>

      <div className="about-page__section">
        <div className="about-page__card about-page__card--narrative">
          <h2 className="about-page__section-title">نبذة عنا</h2>
          <div className="about-page__narrative-text">
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
      </div>

      <div className="about-page__section">
        <div className="about-page__card about-page__card--stats">
          <h3 className="about-page__stats-title">إنجازاتنا حتى اليوم</h3>
          <div className="about-page__stats-grid">
            <div className="about-page__stat-item">
              <FiUsers className="about-page__stat-icon" />
              <span className="about-page__stat-number">{stats.users}+</span>
              <span className="about-page__stat-label">مستخدم نشط</span>
            </div>
            <div className="about-page__stat-item">
              <FiCheckCircle className="about-page__stat-icon" />
              <span className="about-page__stat-number">{stats.completedOrders}+</span>
              <span className="about-page__stat-label">عملية ناجحة</span>
            </div>
            <div className="about-page__stat-item">
              <FiGrid className="about-page__stat-icon" />
              <span className="about-page__stat-number">4</span>
              <span className="about-page__stat-label">خدمات رئيسية</span>
            </div>
            <div className="about-page__stat-item">
              <FiClock className="about-page__stat-icon" />
              <span className="about-page__stat-number">24/7</span>
              <span className="about-page__stat-label">دعم متواصل</span>
            </div>
          </div>
        </div>
      </div>

      <div className="about-page__section">
        <h2 className="about-page__section-title about-page__section-title--center">خدماتنا الرقمية</h2>
        <div className="about-page__services-grid">
          {services.map((service, index) => (
            <div key={index} className="about-page__service-item">
              <div className="about-page__service-icon">{service.icon}</div>
              <h3 className="about-page__service-title">{service.title}</h3>
              <p className="about-page__service-description">{service.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="about-page__contact">
        <h3 className="about-page__contact-title">تواصل معنا</h3>
        <div className="about-page__contact-details">
          <a href="mailto:nezaralrfaye" className="about-page__contact-item">
            <FiMail className="about-page__contact-icon" />
            <span>nezaralrfaye</span>
          </a>
          <a href="tel:+963939454690" className="about-page__contact-item">
            <FiPhone className="about-page__contact-icon" />
            <span>+963 939 454 690</span>
          </a>
          <div className="about-page__contact-item">
            <FiMapPin className="about-page__contact-icon" />
            <span>سوريا - دمشق</span>
          </div>
        </div>
        <p className="about-page__contact-note">
          نحن هنا لمساعدتك على مدار الساعة
        </p>
      </div>
    </div>
  );
}