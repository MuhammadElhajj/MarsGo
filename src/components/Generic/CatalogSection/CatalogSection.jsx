// src/components/Generic/CatalogSection/CatalogSection.jsx
import { useState, useEffect } from 'react';
import CatalogList from '../CatalogList/CatalogList';
import './CatalogSection.css';

export default function CatalogSection({
  title,
  description,
  items,
  type = 'item',
  onItemClick,
  onViewAll,
  showPrice = true,
  maxItemsDesktop = 14,
  maxItemsMobile = 6,
}) {
  const [displayItems, setDisplayItems] = useState([]);

  // تحديث عدد العناصر المعروضة بناءً على حجم الشاشة
  useEffect(() => {
    const updateDisplayItems = () => {
      const isMobile = window.innerWidth < 640;
      const maxItems = isMobile ? maxItemsMobile : maxItemsDesktop;
      const sliced = items?.slice(0, maxItems) || [];
      setDisplayItems(sliced);
    };

    updateDisplayItems();
    window.addEventListener('resize', updateDisplayItems);
    return () => window.removeEventListener('resize', updateDisplayItems);
  }, [items, maxItemsDesktop, maxItemsMobile]);

  const totalCount = items?.length || 0;

  return (
    <div className="catalog-section">
      <div className="catalog-section__header">
        <div>
          <h2 className="catalog-section__title">{title}</h2>
          <p className="catalog-section__description">
            {description}
            <span className="catalog-section__count">{totalCount} {type === 'game' ? 'لعبة' : type === 'app' ? 'تطبيق' : 'منتج'}</span>
          </p>
        </div>
      </div>

      {displayItems.length === 0 ? (
        <div className="catalog-section__empty">لا توجد عناصر لعرضها</div>
      ) : (
        <>
          <CatalogList
            items={displayItems}
            onItemClick={onItemClick}
            showPrice={showPrice}
            type={type}
            showBackButton={false}
            title=""
          />
          {onViewAll && (
            <div className="catalog-section__footer">
              <span className="view-more-link" onClick={onViewAll}>
                المزيد <span className="arrow">›</span>
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}