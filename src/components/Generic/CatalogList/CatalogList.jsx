// src/components/Generic/CatalogList/CatalogList.jsx
import { useMemo } from 'react';
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
  if (!items || items.length === 0) {
    return <p className="catalog-list__empty">لا توجد عناصر لعرضها</p>;
  }

  // ✅ تحسين الأداء: استخدام useMemo لمنع إعادة إنشاء البطاقات إذا لم تتغير items
  const renderedCards = useMemo(() => {
    return items.map(item => (
      <CatalogCard
        key={item.id}
        item={item}
        onSelect={onItemClick}
        showPrice={showPrice}
        customBadge={customBadge}
        type={type}
      />
    ));
  }, [items, onItemClick, showPrice, customBadge, type]);

  return (
    <div className="catalog-list" dir="rtl">
      {showBackButton && (
        <div className="catalog-list__back">
          <GoBackButton text={backButtonText} onClick={onBackClick} />
        </div>
      )}
      {title && <h2 className="catalog-list__title">{title}</h2>}
      <div className="catalog-list__grid">
        {renderedCards}
      </div>
    </div>
  );
}