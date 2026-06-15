// src/pages/User/Catalog/CatalogPage.jsx
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../../firebase';
import Loading from '../../../components/GeneralComponents/Loading/Loading';
import './CatalogPage.css';

export default function CatalogPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const q = query(collection(db, 'categories'), orderBy('order', 'asc'));
        const snapshot = await getDocs(q);
        const categoriesList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCategories(categoriesList);
      } catch (error) {
        console.error('فشل جلب الأقسام:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  if (loading) {
    return <div className="catalog-loading">جاري تحميل الأقسام...</div>;
  }

  if (categories.length === 0) {
    return (
      <div className="catalog-empty">
        <p>لا توجد أقسام متاحة حالياً. قم بإضافتها من لوحة الإدارة.</p>
      </div>
    );
  }

  return (
    <div className="catalog-grid">
      {categories.map((category) => {
        const bgImage = category.bgImageUrl;
        // أسلوب الخلفية الاحتياطي في حال عدم وجود صورة
        const bgStyle = bgImage ? {} : { backgroundColor: category.bgColor || 'var(--color-accent)' };

        return (
          <Link
            key={category.id}
            to={category.isActive ? `/category/${category.id}` : '#'}
            className={`category-card ${!category.isActive ? 'category-card--coming-soon' : ''}`}
            style={bgStyle}
            aria-label={category.name}
          >
            {/* صورة الخلفية مع lazy loading */}
            {bgImage && (
              <img
                src={bgImage}
                alt={category.name}
                className="category-card__bg-image"
                loading="lazy"
                decoding="async"
              />
            )}
            <div className="category-card__overlay"></div>
            <div className="category-card__content">
              {category.icon && <div className="category-card__icon">{category.icon}</div>}
              <h3 className="category-card__title">{category.name}</h3>
              <p className="category-card__description">
                {category.description || 'اكتشف منتجات هذا القسم'}
              </p>
              {!category.isActive && <span className="category-card__badge">قريباً</span>}
            </div>
          </Link>
        );
      })}
    </div>
  );
}