import { FiTag, FiShoppingBag } from 'react-icons/fi';

export const ProductHeader = ({ product, discountPercent, displayUnitPrice, basePrice }) => (
  <div className="product-page__header">
    <div className="product-page__image-wrapper">
      {product.imageUrl ? (
        <img src={product.imageUrl} alt={product.name} className="product-page__image" loading="lazy" />
      ) : (
        <div className="image-placeholder"><FiShoppingBag size={40} /></div>
      )}
    </div>
    <div className="product-page__header-info">
      <h1 className="product-page__title">{product.name}</h1>
      <div className="product-page__price-row">
        <div className="product-page__price">
          {discountPercent > 0 ? (
            <>
              <span className="original-price">{basePrice} $</span>
              <span className="final-price">{displayUnitPrice}</span>
              <span className="discount-badge">-{discountPercent}%</span>
            </>
          ) : (
            <span className="final-price">{displayUnitPrice}</span>
          )}
        </div>
        {product.note && (
          <span className="product-page__note-badge">
            <FiTag /> {product.note}
          </span>
        )}
      </div>
    </div>
  </div>
);