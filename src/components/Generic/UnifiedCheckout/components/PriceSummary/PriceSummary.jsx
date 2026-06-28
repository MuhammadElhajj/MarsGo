import Button from '../../../../GeneralComponents/Button/Button';
import { FiCreditCard } from 'react-icons/fi';

export const PriceSummary = ({ displayTotalPrice, error, loading, isBalanceSufficient, onSubmit }) => (
  <>
    <div className="product-page__total">
      <span><FiCreditCard style={{ marginLeft: '0.5rem' }} /> الإجمالي:</span>
      <strong>{displayTotalPrice}</strong>
    </div>
    {error && <div className="error-message">{error}</div>}
    <Button 
      type="submit" 
      disabled={loading || !isBalanceSufficient} 
      className="buy-button"
      onClick={onSubmit}
    >
      {loading ? '⏳ جاري التنفيذ...' : `تأكيد الشراء (${displayTotalPrice})`}
    </Button>
  </>
);