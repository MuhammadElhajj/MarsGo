// src/components/AdminCoponent/ExternalStoreImport/components/ProductGrid/ProductGrid.jsx
import React from 'react';
import Button from '../../../../GeneralComponents/Button/Button';
import { ProductCardItem } from '../ProductCardItem/ProductCardItem';

export default function ProductGrid({
  displayedProducts,
  markupPercent,
  popularProducts,
  togglePopular,
  selectedParentId,
  handleImportSingle,
  importing,
  selectedParentGlobalImage,
  productImages,
  globalCategoryImage,
  hasMore,
  loadMore,
  isLoadingMore,
  filteredAndSortedProducts,
  visibleCount,
  handleImportAll,
  loading,
}) {
  return (
    <>
      <div className="products-grid">
        {displayedProducts.map((product) => {
          const isPopular = popularProducts.has(product.id);
          const imageUrl = selectedParentGlobalImage || productImages[product.id] || globalCategoryImage || product.image;
          return (
            <ProductCardItem
              key={product.id}
              product={product}
              markupPercent={markupPercent}
              isPopular={isPopular}
              imageUrl={imageUrl}
              onTogglePopular={togglePopular}
              onImportSingle={handleImportSingle}
              isImporting={importing[product.id]}
              selectedParentId={selectedParentId}
            />
          );
        })}
      </div>
      {hasMore && (
        <div className="load-more-button" style={{ textAlign: 'center', marginTop: '1rem' }}>
          <Button onClick={loadMore} disabled={isLoadingMore} variant="secondary">
            {isLoadingMore ? 'جاري التحميل...' : `تحميل المزيد (${filteredAndSortedProducts.length - visibleCount} منتج متبقي)`}
          </Button>
        </div>
      )}
      {selectedParentId && filteredAndSortedProducts.length > 0 && (
        <div className="import-all-button">
          <Button onClick={handleImportAll} variant="secondary" disabled={loading}>
            استيراد جميع المنتجات المعروضة كباقات ({filteredAndSortedProducts.length})
          </Button>
        </div>
      )}
    </>
  );
}