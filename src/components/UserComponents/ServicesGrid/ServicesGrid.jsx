import { Link } from 'react-router-dom';
import { useServices } from '../../../context/ServicesContext';
import './ServicesGrid.css';

export default function ServicesGrid() {
  const { services, loading } = useServices();

  // ✅ إذا كان لا يزال جارٍ التحميل، نظهر رسالة التحميل
  if (loading) {
    return <div className="services-grid-loading" aria-live="polite">جاري تحميل الخدمات...</div>;
  }

  // ✅ بعد انتهاء التحميل، إذا كانت المصفوفة فارغة نعرض رسالة "لا توجد خدمات"
  if (!services.length) {
    return (
      <div className="services-grid-empty">
        <p>لا توجد خدمات متاحة حالياً</p>
      </div>
    );
  }

  return (
    <div className="services-grid">
      {services.map((service) => {
        // دعم bgImageBase64 أو bgImageUrl (من Firebase Storage)
        const bgImage = service.bgImageUrl || service.bgImageBase64;
        const bgStyle = bgImage
          ? { backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : { backgroundColor: service.bgColor || 'var(--color-accent)' };

        return (
          <Link
            key={service.id}
            to={service.isActive ? service.link : '#'}
            className={`service-card ${!service.isActive ? 'service-card--coming-soon' : ''}`}
            style={bgStyle}
            aria-label={service.name}
          >
            <div className="service-card__overlay"></div>
            <div className="service-card__content">
              <div className="service-card__icon" aria-hidden="true">{service.icon || '🔹'}</div>
              <h3 className="service-card__title">{service.name}</h3>
              <p className="service-card__description">{service.description || 'خدمة رقمية متكاملة'}</p>
              {!service.isActive && (
                <span className="service-card__badge">قريباً</span>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}