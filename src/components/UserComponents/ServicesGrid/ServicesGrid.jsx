import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAppStore } from '../../../store/store';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../../firebase';
import './ServicesGrid.css';

export default function ServicesGrid() {
  const services = useAppStore((state) => state.services);
  const setServices = useAppStore((state) => state.setServices);
  const [loading, setLoading] = useState(!services || services.length === 0);

  // جلب البيانات إذا كانت فارغة
  useEffect(() => {
    const fetchServices = async () => {
      if (services && services.length > 0) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const q = query(collection(db, 'services'), orderBy('order', 'asc'));
        const snapshot = await getDocs(q);
        const servicesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setServices(servicesList);
      } catch (err) {
        console.error('خطأ في جلب الخدمات:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, [services, setServices]);

  if (loading) {
    return <div className="services-grid-loading" aria-live="polite">جاري تحميل الخدمات...</div>;
  }

  if (!services || services.length === 0) {
    return (
      <div className="services-grid-empty">
        <p>لا توجد خدمات متاحة حالياً</p>
      </div>
    );
  }

  return (
    <div className="services-grid">
      {services.map((service) => {
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
              <h3 className="service-card__title">{service.name}</h3>
              <p className="service-card__description">{service.description || 'خدمة رقمية متكاملة'}</p>
              {!service.isActive && <span className="service-card__badge">قريباً</span>}
            </div>
          </Link>
        );
      })}
    </div>
  );
}