// src/components/Generic/UnifiedCheckout/UnifiedCheckout.jsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useAppStore } from '../../../store/store';
import { db } from '../../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import Button from '../../GeneralComponents/Button/Button';
import GoBackButton from '../../GeneralComponents/GoBackButton/GoBackButton';
import { showToast } from '../../GeneralComponents/ToastNotification/ToastNotification';
import { sendWhatsAppNotification, formatOrderMessage } from '../../../utils/sendWhatsAppNotification';
import Loading from '../../GeneralComponents/Loading/Loading';
import DynamicFields from './DynamicFields';
import { FiDollarSign, FiTag, FiShoppingBag, FiCreditCard, FiZap } from 'react-icons/fi';
import './UnifiedCheckout.css';

export default function UnifiedCheckout() {
  const { productId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { userData } = useAuth();
  
  const balance = useAppStore((state) => state.balance);
  const deductBalance = useAppStore((state) => state.deductBalance);
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

  if (dataError) {
    return (
      <div className="unified-checkout product-page" dir="rtl">
        <div className="product-page__back">
          <GoBackButton text="رجوع" onClick={() => navigate(-1)} />
        </div>
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

  // ✅ السماح بالكمية للمنتجات المتغيرة (ألعاب وتطبيقات)
  const isVariableQuantity = product.quantityType === 'variable' && (product.maxQuantity > 1 || product.minQuantity > 1);
  const hasCustomQuantityField = product.customFields?.some(f => f.name === 'quantity');
  const allowQuantity = isVariableQuantity || hasCustomQuantityField || product.type === 'app';
  
  const basePrice = product.price || 0;
  const discountPercent = product.discount || 0;
  const discountedPrice = discountPercent > 0 ? basePrice * (1 - discountPercent / 100) : basePrice;
  const totalPrice = discountedPrice * (allowQuantity ? quantity : 1);
  
  const displayTotalPrice = currency === 'USD'
    ? `${totalPrice.toFixed(2)} $`
    : exchangeRate ? `${(totalPrice * exchangeRate).toFixed(0).toLocaleString()} ل.س` : '...';
  const displayUnitPrice = currency === 'USD'
    ? `${discountedPrice.toFixed(2)} $`
    : exchangeRate ? `${(discountedPrice * exchangeRate).toFixed(0).toLocaleString()} ل.س` : '...';

  const isBalanceSufficient = balance >= totalPrice;
  const balanceStatusMessage = isBalanceSufficient ? 'رصيد كافي ✓' : 'الرصيد غير كافي لتغطية هذا الطلب';

  const validateForm = () => {
    const fieldsToValidate = (product.customFields || []).filter(f => f.name !== 'quantity');
    const missing = fieldsToValidate.filter(f => f.required && !customValues[f.name]);
    if (missing.length) {
      return `يرجى ملء: ${missing.map(m => m.label).join(', ')}`;
    }
    if (!isBalanceSufficient) {
      return `رصيدك غير كافٍ. المطلوب: ${totalPrice.toFixed(2)} $، رصيدك: ${balance.toFixed(2)} $`;
    }
    return null;
  };

  const getOrderData = () => ({
    userId: userData.uid,
    customerName: userData.name || '',
    productId: product.id,
    productName: product.name,
    categoryId: product.categoryId,
    type: product.type,
    priceUSD: discountedPrice,
    finalPriceUSD: totalPrice,
    quantity: allowQuantity ? quantity : 1,
    customFieldsValues: customValues,
    status: 'completed',
    paidByBalance: true,
    createdAt: serverTimestamp(),
    exchangeRateAtPurchase: exchangeRate || null,
    currencyUsed: currency,
    productNote: product.note || '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    const errMsg = validateForm();
    if (errMsg) {
      setError(errMsg);
      return;
    }
    setLoading(true);
    try {
      const deducted = await deductBalance(totalPrice);
      if (!deducted) throw new Error('فشل خصم الرصيد');
      const orderData = getOrderData();
      const docRef = await addDoc(collection(db, 'orders'), orderData);
      const orderMessageData = {
        productName: product.name,
        quantity: allowQuantity ? quantity : 1,
        customValues,
        totalPrice,
        customerName: userData.name || ''
      };
      const message = formatOrderMessage(orderMessageData, docRef.id, 'product');
      await sendWhatsAppNotification(null, message, null);
      addNotification({
        id: docRef.id,
        userId: userData.uid,
        title: '✅ طلب مكتمل',
        message: `طلب #${docRef.id.slice(-6)} - تم خصم ${totalPrice.toFixed(2)} $ من رصيدك`,
        type: 'order_completed',
        link: '/my-orders',
        read: false,
        createdAt: new Date(),
      });
      showToast('✅ تم تنفيذ طلبك بنجاح!', 'success', 3000);
      setTimeout(() => navigate('/my-orders'), 1500);
    } catch (err) {
      console.error(err);
      showToast(`❌ فشل الطلب: ${err.message}`, 'error', 5000);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (e) => {
    const newQty = parseFloat(e.target.value) || 0;
    const min = isVariableQuantity ? product.minQuantity : 1;
    const max = isVariableQuantity ? product.maxQuantity : 100;
    const clamped = Math.min(Math.max(newQty, min), max);
    setQuantity(clamped);
    if (product.customFields?.some(f => f.name === 'quantity')) {
      setCustomValues(prev => ({ ...prev, quantity: clamped }));
    }
  };

  const imageUrl = product.imageUrl;

  return (
    <div className="unified-checkout product-page" dir="rtl">
      <div className="product-page__back">
        <GoBackButton text="رجوع" onClick={() => navigate(-1)} />
      </div>
      <div className="product-page__card">
        <div className="product-page__header">
          <div className="product-page__image-wrapper">
            {imageUrl ? (
              <img src={imageUrl} alt={product.name} className="product-page__image" />
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

        <div className={`balance-card ${isBalanceSufficient ? 'balance-sufficient' : 'balance-insufficient'}`}>
          <div className="balance-label">
            <FiDollarSign size={20} /> رصيدك الحالي
          </div>
          <div className="balance-amount">{balance.toFixed(2)} $</div>
        </div>
        {!isBalanceSufficient && (
          <div className="balance-warning">{balanceStatusMessage}</div>
        )}

        <form onSubmit={handleSubmit} className="product-page__form">
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
                onChange={handleQuantityChange}
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
            onChange={setCustomValues}
            initialValues={customValues}
          />

          <div className="product-page__total">
            <span><FiCreditCard style={{ marginLeft: '0.5rem' }} /> الإجمالي:</span>
            <strong>{displayTotalPrice}</strong>
          </div>

          {error && <div className="error-message">{error}</div>}

          <Button 
            type="submit" 
            disabled={loading || !isBalanceSufficient} 
            className="buy-button"
          >
            {loading ? '⏳ جاري التنفيذ...' : `تأكيد الشراء (${displayTotalPrice})`}
          </Button>
        </form>
      </div>
    </div>
  );
}