// src/components/Generic/UnifiedCheckout/UnifiedCheckout.jsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAuth } from '../../../context/AuthContext';
import { useAppStore } from '../../../store/store';
import { showToast } from '../../GeneralComponents/ToastNotification/ToastNotification';
import Button from '../../GeneralComponents/Button/Button';
import Loading from '../../GeneralComponents/Loading/Loading';
import DynamicFields from './DynamicFields';
import { FiDollarSign, FiTag, FiShoppingBag, FiCreditCard, FiZap } from 'react-icons/fi';
import './UnifiedCheckout.css';

// مكونات فرعية (معدلة)
const ProductHeader = ({ product, discountPercent, displayUnitPrice, basePrice }) => (
  <div className="product-page__header">
    <div className="product-page__image-wrapper">
      {product.imageUrl ? (
        <img src={product.imageUrl} alt={product.name} className="product-page__image" />
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
      </div>
      {product.note && (
        <div className="product-page__note">
          <FiTag className="product-page__note-icon" />
          <span>{product.note}</span>
        </div>
      )}
    </div>
  </div>
);

const BalanceCard = ({ balance, isSufficient }) => (
  <div className={`balance-card ${isSufficient ? 'balance-sufficient' : 'balance-insufficient'}`}>
    <div className="balance-label">
      <FiDollarSign size={20} /> رصيدك الحالي
    </div>
    <div className="balance-amount">{balance.toFixed(2)} $</div>
  </div>
);

const OrderForm = ({ product, allowQuantity, quantity, onQuantityChange, isVariableQuantity, customValues, onCustomChange }) => (
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

const PriceSummary = ({ displayTotalPrice, error, loading, isBalanceSufficient, onSubmit }) => (
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

// المكون الرئيسي
export default function UnifiedCheckout() {
  const { productId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { userData } = useAuth();
  
  const balance = useAppStore((state) => state.balance);
  const addNotification = useAppStore((state) => state.addNotification);
  const currency = useAppStore((state) => state.currency);
  const exchangeRate = useAppStore((state) => state.exchangeRate);
  const products = useAppStore((state) => state.products);
  const fetchProducts = useAppStore((state) => state.fetchProducts);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [customValues, setCustomValues] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [dataError, setDataError] = useState(false);

  const stateData = location.state || {};
  const { item, package: pkg, serviceType = 'unknown' } = stateData;
  
  const hasPackageData = pkg && (pkg.id || pkg.name);
  const hasItemData = item && item.id;
  const isLocalPackage = hasPackageData && (hasItemData || serviceType !== 'unknown');

  const product = useMemo(() => {
    if (isLocalPackage) {
      const customFields = (item?.customFields ? [...item.customFields] : []);
      const effectiveServiceType = serviceType || (item?.type === 'game' ? 'gaming' : item?.type === 'app' ? 'apps' : 'gaming');
      
      if (effectiveServiceType === 'gaming' && !customFields.some(f => f.name === 'playerId')) {
        customFields.push({
          label: 'معرف اللاعب (Player ID)',
          name: 'playerId',
          type: 'text',
          required: true,
          placeholder: 'أدخل معرف اللاعب'
        });
      }
      if (effectiveServiceType === 'apps' && !customFields.some(f => f.name === 'quantity')) {
        customFields.push({
          label: 'الكمية',
          name: 'quantity',
          type: 'number',
          required: true,
          min: 1,
          max: 100,
          defaultValue: 1
        });
      }
      
      return {
        id: pkg.id,
        name: pkg.name,
        price: pkg.price || 0,
        discount: pkg.discount || 0,
        currency: pkg.currency || 'USD',
        imageUrl: pkg.imageUrl || item?.imageUrl || '',
        customFields: customFields,
        note: pkg.note || item?.note || '',
        type: effectiveServiceType === 'gaming' ? 'game' : 'app',
        categoryId: effectiveServiceType === 'gaming' ? 'games' : 'apps',
        quantityType: pkg.quantityType || 'fixed',
        minQuantity: pkg.minQuantity ?? 1,
        maxQuantity: pkg.maxQuantity ?? 1,
      };
    } 
    else if (productId) {
      return products.find(p => p.id === productId) || null;
    }
    return null;
  }, [productId, products, isLocalPackage, item, pkg, serviceType]);

  useEffect(() => {
    if (productId && !product && !isLocalPackage && products.length === 0) {
      fetchProducts();
    }
  }, [productId, product, isLocalPackage, fetchProducts, products.length]);

  useEffect(() => {
    if (!isLocalPackage && !productId) {
      setDataError(true);
      setError('لا توجد بيانات المنتج. يرجى العودة إلى صفحة المنتجات والمحاولة مرة أخرى.');
    } else if (isLocalPackage && !pkg) {
      setDataError(true);
      setError('بيانات الباقة غير مكتملة. يرجى المحاولة مرة أخرى.');
    } else {
      setDataError(false);
      setError('');
    }
  }, [isLocalPackage, productId, pkg]);

  useEffect(() => {
    if (product?.customFields) {
      const defaults = {};
      product.customFields.forEach(f => {
        if (f.defaultValue !== undefined) defaults[f.name] = f.defaultValue;
        if (f.name === 'quantity') setQuantity(f.defaultValue || 1);
      });
      setCustomValues(defaults);
    } else {
      setCustomValues({});
      setQuantity(1);
    }
  }, [product]);

  const isVariableQuantity = product?.quantityType === 'variable' && (product.maxQuantity > 1 || product.minQuantity > 1);
  const hasCustomQuantityField = product?.customFields?.some(f => f.name === 'quantity');
  const allowQuantity = isVariableQuantity || hasCustomQuantityField || product?.type === 'app';
  
  const basePrice = product?.price || 0;
  const discountPercent = product?.discount || 0;
  const discountedPrice = discountPercent > 0 ? basePrice * (1 - discountPercent / 100) : basePrice;
  const totalPrice = discountedPrice * (allowQuantity ? quantity : 1);
  
  const displayTotalPrice = currency === 'USD'
    ? `${totalPrice.toFixed(2)} $`
    : exchangeRate ? `${(totalPrice * exchangeRate).toFixed(0).toLocaleString()} ل.س` : '...';
  const displayUnitPrice = currency === 'USD'
    ? `${discountedPrice.toFixed(2)} $`
    : exchangeRate ? `${(discountedPrice * exchangeRate).toFixed(0).toLocaleString()} ل.س` : '...';

  const isBalanceSufficient = balance >= totalPrice;

  const validateForm = useCallback(() => {
    const fieldsToValidate = (product?.customFields || []).filter(f => f.name !== 'quantity');
    const missing = fieldsToValidate.filter(f => f.required && !customValues[f.name]);
    if (missing.length) {
      return `يرجى ملء: ${missing.map(m => m.label).join(', ')}`;
    }
    if (!isBalanceSufficient) {
      return `رصيدك غير كافٍ. المطلوب: ${totalPrice.toFixed(2)} $، رصيدك: ${balance.toFixed(2)} $`;
    }
    return null;
  }, [product, customValues, isBalanceSufficient, totalPrice, balance]);

  const handleQuantityChange = useCallback((e) => {
    const newQty = parseFloat(e.target.value) || 0;
    const min = isVariableQuantity ? product.minQuantity : 1;
    const max = isVariableQuantity ? product.maxQuantity : 100;
    const clamped = Math.min(Math.max(newQty, min), max);
    setQuantity(clamped);
    if (product?.customFields?.some(f => f.name === 'quantity')) {
      setCustomValues(prev => ({ ...prev, quantity: clamped }));
    }
  }, [isVariableQuantity, product]);

  const functions = getFunctions();
  const createOrderFn = httpsCallable(functions, 'createSecureOrder');

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (loading) return;
    const errMsg = validateForm();
    if (errMsg) {
      setError(errMsg);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const orderPayload = {
        finalPriceUSD: totalPrice,
        productId: product.id,
        productName: product.name,
        customFieldsValues: customValues,
        type: product.type,
        categoryId: product.categoryId,
        quantity: allowQuantity ? quantity : 1,
        priceUSD: discountedPrice,
        currencyUsed: currency,
        exchangeRateAtPurchase: exchangeRate || null,
        productNote: product.note || '',
      };

      const result = await createOrderFn(orderPayload);
      if (result.data.success) {
        const orderId = result.data.orderId;
        addNotification({
          id: orderId,
          userId: userData.uid,
          title: '✅ طلب مكتمل',
          message: `طلب #${orderId.slice(-6)} - تم خصم ${totalPrice.toFixed(2)} $ من رصيدك`,
          type: 'order_completed',
          link: '/my-orders',
          read: false,
          createdAt: new Date(),
        });
        showToast('✅ تم تنفيذ طلبك بنجاح!', 'success', 3000);
        setTimeout(() => navigate('/my-orders'), 1500);
      } else {
        throw new Error(result.data.message || 'فشل إنشاء الطلب');
      }
    } catch (err) {
      console.error(err);
      showToast(`❌ فشل الطلب: ${err.message}`, 'error', 5000);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [loading, validateForm, totalPrice, product, customValues, allowQuantity, quantity, discountedPrice, currency, exchangeRate, addNotification, userData, navigate, createOrderFn]);

  if (dataError) {
    return (
      <div className="unified-checkout product-page" dir="rtl">
        <div className="error-container">
          <h3>⚠️ {error}</h3>
          <Button onClick={() => navigate(-1)}>العودة</Button>
        </div>
      </div>
    );
  }

  if (!product) {
    return <Loading text={isLocalPackage ? 'جاري تحميل الباقة...' : 'جاري تحميل المنتج...'} />;
  }

  return (
    <div className="unified-checkout product-page" dir="rtl">
      <div className="product-page__card">
        <ProductHeader 
          product={product} 
          discountPercent={discountPercent} 
          displayUnitPrice={displayUnitPrice}
          basePrice={basePrice}
        />

        <BalanceCard 
          balance={balance} 
          isSufficient={isBalanceSufficient} 
        />

        {!isBalanceSufficient && (
          <div className="balance-warning">الرصيد غير كافي لتغطية هذا الطلب</div>
        )}

        <OrderForm 
          product={product}
          allowQuantity={allowQuantity}
          quantity={quantity}
          onQuantityChange={handleQuantityChange}
          isVariableQuantity={isVariableQuantity}
          customValues={customValues}
          onCustomChange={setCustomValues}
        />

        <PriceSummary 
          displayTotalPrice={displayTotalPrice}
          error={error}
          loading={loading}
          isBalanceSufficient={isBalanceSufficient}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}