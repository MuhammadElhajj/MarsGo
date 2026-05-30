import { Link } from 'react-router-dom';
import { useServices } from '../../../context/ServicesContext';
import './ServicesGrid.css';

export default function ServicesGrid() {
  const { services, loading } = useServices();

  if (loading) {
    return <div className="services-grid-loading">جاري تحميل الخدمات...</div>;
  }

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
        // تحديد الخلفية: صورة أو لون
        const bgStyle = service.backgroundImageBase64
          ? { backgroundImage: `url(${service.backgroundImageBase64})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : { backgroundColor: service.backgroundColor || 'var(--color-accent)' };

        return (
          <Link
            key={service.id}
            to={service.isActive ? service.link : '#'}
            className={`service-card ${!service.isActive ? 'service-card--coming-soon' : ''}`}
            style={bgStyle}
          >
            <div className="service-card__overlay"></div>
            <div className="service-card__content">
              <div className="service-card__icon">{service.icon || ''}</div>
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