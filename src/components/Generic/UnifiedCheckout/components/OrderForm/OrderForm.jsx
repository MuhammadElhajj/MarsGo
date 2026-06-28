import DynamicFields from '../../DynamicFields';
import { FiZap } from 'react-icons/fi';

export const OrderForm = ({ 
  product, 
  allowQuantity, 
  quantity, 
  onQuantityChange, 
  isVariableQuantity, 
  customValues, 
  onCustomChange 
}) => (
  <form className="product-page__form">
    {allowQuantity && (
      <div className="form-group">
        <label className="form-label">
          <FiZap size={16} style={{ marginLeft: '0.3rem' }} />
          الكمية / المبلغ المطلوب
        </label>
        <input
          type="number"
          min={isVariableQuantity ? product.minQuantity : 1}
          max={isVariableQuantity ? product.maxQuantity : 100}
          step={isVariableQuantity ? "0.01" : "1"}
          value={quantity}
          onChange={onQuantityChange}
          className="quantity-input"
        />
        {isVariableQuantity && (
          <small className="quantity-range-hint">
            الحد الأدنى: {product.minQuantity} - الحد الأعلى: {product.maxQuantity}
          </small>
        )}
      </div>
    )}
    <DynamicFields
      fields={(product.customFields || []).filter(f => f.name !== 'quantity')}
      onChange={onCustomChange}
      initialValues={customValues}
    />
  </form>
);