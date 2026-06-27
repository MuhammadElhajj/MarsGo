// src/components/AdminCoponent/ExternalStoreImport/components/ProductCardItem/ProductCardItem.jsx
import { useState, memo } from 'react';
import { FiStar } from 'react-icons/fi';
import Button from '../../../../GeneralComponents/Button/Button';
import ImageUpload from '../../../../GeneralComponents/ImageUpload/ImageUpload';
import './ProductCardItem.css';

export const ProductCardItem = memo(({
  product,
  markupPercent,
  isPopular,
  imageUrl,
  onTogglePopular,
  onImportSingle,
  isImporting,
  selectedParentId
}) => {
  const finalPrice = product.price * (1 + markupPercent / 100);
  const [localImageUrl, setLocalImageUrl] = useState(imageUrl);
  const qtyValues = product.qty_values || { min: 1, max: 1 };
  const isVariable = qtyValues.min !== qtyValues.max || qtyValues.min > 1;

  const handleImageUpload = (url) => {
    setLocalImageUrl(url);
    onTogglePopular(product.id, url);
  };

  const handleTogglePopular = () => {
    onTogglePopular(product.id);
  };

  return (
    <div className="product-card">
      <div className="product-card__image">
        {localImageUrl ? <img src={localImageUrl} alt={product.name} loading="lazy" /> : <div className="image-placeholder">📦</div>}
        <div className="image-upload-wrapper">
          <ImageUpload
            onUploadComplete={handleImageUpload}
            maxSizeMB={0.5}
            storagePath={`store_import/products/${product.id}`}
            label="صورة خاصة"
            className="small-upload"
          />
        </div>
      </div>
      <div className="product-card__info">
        <h3 title={product.name}>{product.name}</h3>
        <span className="category-badge">{product.category_name || 'عام'}</span>
        <div className="prices">
          <span className="original-price">{product.price} $</span>
          <span className="final-price">{finalPrice.toFixed(2)} $</span>
        </div>
        <div className="stock">المخزون: {product.stock ?? 'غير محدد'}</div>
        <div className="quantity-info">
          <span className={`quantity-badge ${isVariable ? 'variable' : 'fixed'}`}>
            {isVariable ? '🔄 كمية متغيرة' : '📦 كمية ثابتة'}
          </span>
          {isVariable && (
            <span className="quantity-range">
              الحد الأدنى: {qtyValues.min} - الحد الأعلى: {qtyValues.max}
            </span>
          )}
        </div>
      </div>
      <div className="product-card__actions">
        <button className={`popular-btn ${isPopular ? 'active' : ''}`} onClick={handleTogglePopular}>
          <FiStar /> {isPopular ? 'مميز' : 'تمييز'}
        </button>
        <Button onClick={() => onImportSingle(product)} disabled={!selectedParentId || isImporting}>
          {isImporting ? 'جاري...' : 'استيراد كباقة'}
        </Button>
      </div>
    </div>
  );
});