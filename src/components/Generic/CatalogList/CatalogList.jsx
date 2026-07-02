// src/components/Generic/CatalogList/CatalogList.jsx
import { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import CatalogCard from '../CatalogCard/CatalogCard';
import GoBackButton from '../../GeneralComponents/GoBackButton/GoBackButton';
import './CatalogList.css';

export default function CatalogList({
  items,
  onItemClick,
  title,
  showBackButton = true,
  backButtonText = "رجوع",
  onBackClick,
  showPrice = false,
  customBadge = null,
  type = 'item'
}) {
  const navigate = useNavigate();

  if (!items || !Array.isArray(items) || items.length === 0) {
    return <div className="catalog-list__empty">لا توجد عناصر لعرضها</div>;
  }

  const handleItemClick = useCallback((item) => {
    // ✅ منع أي خطأ في حالة عدم وجود item
    if (!item) return;

    // ✅ إذا تم تمرير دالة onItemClick من الخارج (مثل PackagesList) نستخدمها
    if (onItemClick && typeof onItemClick === 'function') {
      try {
        onItemClick(item);
      } catch (err) {
        console.error('خطأ في onItemClick:', err);
        // في حالة فشل onItemClick، نلجأ للتنقل الافتراضي
        navigate(`/checkout/${item.id}`, { state: { item } });
      }
    } else {
      // ✅ التنقل الافتراضي (في حالة عدم وجود onItemClick)
      navigate(`/checkout/${item.id}`, { state: { item } });
    }
  }, [onItemClick, navigate]);

  const renderedCards = useMemo(() => {
    try {
      return items.map(item => (
        <CatalogCard
          key={item.id}
          item={item}
          onSelect={handleItemClick}
          showPrice={showPrice}
          customBadge={customBadge}
          type={type}
        />
      ));
    } catch (error) {
      console.error('خطأ في عرض الكروت:', error);
      return <div className="catalog-list__error">حدث خطأ في عرض العناصر</div>;
    }
  }, [items, handleItemClick, showPrice, customBadge, type]);

  return (
    <div className="catalog-list" dir="rtl">
     
      {title && <h2 className="catalog-list__title">{title}</h2>}
      <div className="catalog-list__grid">
        {renderedCards}
      </div>
    </div>
  );
}