// // src/components/Generic/UnifiedCheckout/UnifiedCheckout.jsx
// import { useState, useEffect, useMemo, useCallback } from 'react';
// import { useParams, useNavigate, useLocation } from 'react-router-dom';
// import { useAuth } from '../../../context/AuthContext';
// import { useAppStore } from '../../../store/store';
// import { db } from '../../../firebase';
// import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
// import Button from '../../GeneralComponents/Button/Button';
// import GoBackButton from '../../GeneralComponents/GoBackButton/GoBackButton';
// import { showToast } from '../../GeneralComponents/ToastNotification/ToastNotification';
// import { sendWhatsAppNotification, formatOrderMessage } from '../../../utils/sendWhatsAppNotification';
// import Loading from '../../GeneralComponents/Loading/Loading';
// import DynamicFields from './DynamicFields';
// import './UnifiedCheckout.css';

// export default function UnifiedCheckout() {
//   const { productId } = useParams();
//   const location = useLocation();
//   const navigate = useNavigate();
//   const { userData } = useAuth();
  
//   const balance = useAppStore((state) => state.balance);
//   const deductBalance = useAppStore((state) => state.deductBalance);
//   const addNotification = useAppStore((state) => state.addNotification);
//   const currency = useAppStore((state) => state.currency);
//   const exchangeRate = useAppStore((state) => state.exchangeRate);
//   const products = useAppStore((state) => state.products);
//   const fetchProducts = useAppStore((state) => state.fetchProducts);

//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [customValues, setCustomValues] = useState({});
//   const [quantity, setQuantity] = useState(1);
//   const [dataError, setDataError] = useState(false);

//   const { item, package: pkg, serviceType } = location.state || {};
//   const isLocalPackage = !!(item && pkg && serviceType);

//   const product = useMemo(() => {
//     if (isLocalPackage) {
//       const customFields = item.customFields ? [...item.customFields] : [];
//       if (serviceType === 'gaming' && !customFields.some(f => f.name === 'playerId')) {
//         customFields.push({
//           label: 'معرف اللاعب (Player ID)',
//           name: 'playerId',
//           type: 'text',
//           required: true,
//           placeholder: 'أدخل معرف اللاعب'
//         });
//       }
//       if (serviceType === 'apps' && !customFields.some(f => f.name === 'quantity')) {
//         customFields.push({
//           label: 'الكمية',
//           name: 'quantity',
//           type: 'number',
//           required: true,
//           min: 1,
//           max: 100,
//           defaultValue: 1
//         });
//       }
//       return {
//         id: pkg.id,
//         name: pkg.name,
//         price: pkg.price || 0,
//         discount: pkg.discount || 0,
//         currency: pkg.currency || 'USD',
//         imageUrl: pkg.imageUrl || item.imageUrl || '',
//         customFields: customFields,
//         note: pkg.note || item.note || '',
//         type: serviceType === 'gaming' ? 'game' : 'app',
//         categoryId: serviceType === 'gaming' ? 'games' : 'apps',
//       };
//     } else if (productId) {
//       return products.find(p => p.id === productId) || null;
//     }
//     return null;
//   }, [productId, products, isLocalPackage, item, pkg, serviceType]);

//   useEffect(() => {
//     if (productId && !product && !isLocalPackage && products.length === 0) {
//       fetchProducts();
//     }
//   }, [productId, product, isLocalPackage, fetchProducts, products.length]);

//   useEffect(() => {
//     if (!isLocalPackage && !productId) {
//       setDataError(true);
//       setError('لا توجد بيانات المنتج. يرجى العودة إلى صفحة المنتجات والمحاولة مرة أخرى.');
//     } else if (isLocalPackage && (!item || !pkg)) {
//       setDataError(true);
//       setError('بيانات الباقة غير مكتملة. يرجى المحاولة مرة أخرى.');
//     } else {
//       setDataError(false);
//       setError('');
//     }
//   }, [isLocalPackage, productId, item, pkg]);

//   useEffect(() => {
//     if (product?.customFields) {
//       const defaults = {};
//       product.customFields.forEach(f => {
//         if (f.defaultValue !== undefined) defaults[f.name] = f.defaultValue;
//         if (f.name === 'quantity') setQuantity(f.defaultValue || 1);
//       });
//       setCustomValues(defaults);
//     } else {
//       setCustomValues({});
//       setQuantity(1);
//     }
//   }, [product]);

//   if (dataError) {
//     return (
//       <div className="unified-checkout product-page" dir="rtl">
//         <div className="product-page__back">
//           <GoBackButton text="رجوع" onClick={() => navigate(-1)} />
//         </div>
//         <div className="error-container">
//           <h3>⚠️ {error}</h3>
//           <Button onClick={() => navigate(-1)}>العودة</Button>
//         </div>
//       </div>
//     );
//   }

//   if (!product) {
//     return <Loading text={isLocalPackage ? 'جاري تحميل الباقة...' : 'جاري تحميل المنتج...'} />;
//   }

//   const allowQuantity = product.customFields?.some(f => f.name === 'quantity') || product.type === 'app';
//   const basePrice = product.price || 0;
//   const discountPercent = product.discount || 0;
//   const discountedPrice = discountPercent > 0 ? basePrice * (1 - discountPercent / 100) : basePrice;
//   const totalPrice = discountedPrice * (allowQuantity ? quantity : 1);
  
//   const displayTotalPrice = currency === 'USD'
//     ? `${totalPrice.toFixed(2)} $`
//     : exchangeRate ? `${(totalPrice * exchangeRate).toFixed(0).toLocaleString()} ل.س` : '...';
//   const displayUnitPrice = currency === 'USD'
//     ? `${discountedPrice.toFixed(2)} $`
//     : exchangeRate ? `${(discountedPrice * exchangeRate).toFixed(0).toLocaleString()} ل.س` : '...';

//   const isBalanceSufficient = balance >= totalPrice;
//   const balanceStatusMessage = isBalanceSufficient 
//     ? ' رصيد كافٍ، يمكنك إتمام الشراء' 
//     : ` الرصيد غير كافٍ. المطلوب: ${totalPrice.toFixed(2)} $، رصيدك: ${balance.toFixed(2)} $`;

//   const validateForm = () => {
//     const fieldsToValidate = (product.customFields || []).filter(f => f.name !== 'quantity');
//     const missing = fieldsToValidate.filter(f => f.required && !customValues[f.name]);
//     if (missing.length) {
//       return `يرجى ملء: ${missing.map(m => m.label).join(', ')}`;
//     }
//     if (!isBalanceSufficient) {
//       return balanceStatusMessage;
//     }
//     return null;
//   };

//   const getOrderData = () => ({
//     userId: userData.uid,
//     customerName: userData.name || '',
//     productId: product.id,
//     productName: product.name,
//     categoryId: product.categoryId,
//     type: product.type,
//     priceUSD: discountedPrice,
//     finalPriceUSD: totalPrice,
//     quantity: allowQuantity ? quantity : 1,
//     customFieldsValues: customValues,
//     status: 'completed',
//     paidByBalance: true,
//     createdAt: serverTimestamp(),
//     exchangeRateAtPurchase: exchangeRate || null,
//     currencyUsed: currency,
//     productNote: product.note || '',
//   });

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (loading) return;
//     const errMsg = validateForm();
//     if (errMsg) {
//       setError(errMsg);
//       return;
//     }
//     setLoading(true);
//     try {
//       const deducted = await deductBalance(totalPrice);
//       if (!deducted) throw new Error('فشل خصم الرصيد');
//       const orderData = getOrderData();
//       const docRef = await addDoc(collection(db, 'orders'), orderData);
//       const orderMessageData = {
//         productName: product.name,
//         quantity: allowQuantity ? quantity : 1,
//         customValues,
//         totalPrice,
//         customerName: userData.name || ''
//       };
//       const message = formatOrderMessage(orderMessageData, docRef.id, 'product');
//       await sendWhatsAppNotification(null, message, null);
//       addNotification({
//         id: docRef.id,
//         userId: userData.uid,
//         title: '✅ طلب مكتمل',
//         message: `طلب #${docRef.id.slice(-6)} - تم خصم ${totalPrice.toFixed(2)} $ من رصيدك`,
//         type: 'order_completed',
//         link: '/my-orders',
//         read: false,
//         createdAt: new Date(),
//       });
//       showToast('✅ تم تنفيذ طلبك بنجاح!', 'success', 3000);
//       setTimeout(() => navigate('/my-orders'), 1500);
//     } catch (err) {
//       console.error(err);
//       showToast(`❌ فشل الطلب: ${err.message}`, 'error', 5000);
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleQuantityChange = (e) => {
//     const newQty = parseInt(e.target.value) || 1;
//     setQuantity(newQty);
//     if (product.customFields?.some(f => f.name === 'quantity')) {
//       setCustomValues(prev => ({ ...prev, quantity: newQty }));
//     }
//   };

//   const imageUrl = product.imageUrl;

//   return (
//     <div className="unified-checkout product-page" dir="rtl">
//       <div className="product-page__back">
//         <GoBackButton text="رجوع" onClick={() => navigate(-1)} />
//       </div>
//       <div className="product-page__container">
//         <div className="product-page__image">
//           {imageUrl ? <img src={imageUrl} alt={product.name} /> : <div className="image-placeholder">📦</div>}
//         </div>

//         <div className="product-page__details">
//           <h1 className="product-page__title">{product.name}</h1>
//           {product.note && (
//             <div className="product-page__note">
//               <strong>ملاحظة المدير:</strong> {product.note}
//             </div>
//           )}

//           <div className="product-page__price">
//             {discountPercent > 0 ? (
//               <>
//                 <span className="original-price">{basePrice} $</span>
//                 <span className="final-price">{displayUnitPrice}</span>
//                 <span className="discount-badge">-{discountPercent}%</span>
//               </>
//             ) : (
//               <span className="final-price">{displayUnitPrice}</span>
//             )}
//           </div>

//           {/* كارد الرصيد مع لون متغير */}
//           <div className={`balance-card ${isBalanceSufficient ? 'balance-sufficient' : 'balance-insufficient'}`}>
//             <div className="balance-label"> رصيدك الحالي</div>
//             <div className="balance-amount">{balance.toFixed(2)} $</div>
//           </div>
//           {!isBalanceSufficient && (
//             <div className="balance-warning">{balanceStatusMessage}</div>
//           )}

//           <form onSubmit={handleSubmit} className="product-page__form">
//             {allowQuantity && (
//               <div className="form-group">
//                 <label>الكمية</label>
//                 <input
//                   type="number"
//                   min="1"
//                   step="1"
//                   value={quantity}
//                   onChange={handleQuantityChange}
//                   className="quantity-input"
//                 />
//               </div>
//             )}

//             <DynamicFields
//               fields={(product.customFields || []).filter(f => f.name !== 'quantity')}
//               onChange={setCustomValues}
//               initialValues={customValues}
//             />

//             <div className="product-page__total">
//               <span>الإجمالي:</span>
//               <strong>{displayTotalPrice}</strong>
//             </div>

//             {error && <div className="error-message">{error}</div>}

//             <Button 
//               type="submit" 
//               disabled={loading || !isBalanceSufficient} 
//               className="buy-button"
//             >
//               {loading ? 'جاري التنفيذ...' : `تأكيد الشراء (${displayTotalPrice})`}
//             </Button>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// }

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
import './UnifiedCheckout.css';

export default function UnifiedCheckout() {
  const { productId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { userData } = useAuth();
  
  // Zustand store
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

  // استقبال البيانات من location.state (مرنة)
  const stateData = location.state || {};
  const { item, package: pkg, serviceType = 'unknown' } = stateData;
  
  // عرض البيانات في الكونسول للمساعدة في التصحيح
  console.log('📍 UnifiedCheckout - state:', { item, pkg, serviceType, productId });

  // التحقق من وجود بيانات كافية
  const hasPackageData = pkg && (pkg.id || pkg.name);
  const hasItemData = item && item.id;
  
  // إذا كانت الباقة موجودة حتى لو لم يكن item (مثلاً في التطبيقات)
  const isLocalPackage = hasPackageData && (hasItemData || serviceType !== 'unknown');

  // بناء المنتج
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
      
      // استخدام بيانات الباقة بشكل رئيسي
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
      };
    } 
    else if (productId) {
      return products.find(p => p.id === productId) || null;
    }
    return null;
  }, [productId, products, isLocalPackage, item, pkg, serviceType]);

  // جلب المنتجات إذا لزم الأمر
  useEffect(() => {
    if (productId && !product && !isLocalPackage && products.length === 0) {
      fetchProducts();
    }
  }, [productId, product, isLocalPackage, fetchProducts, products.length]);

  // التحقق من صحة البيانات مع رسائل واضحة
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

  // تهيئة القيم الافتراضية
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

  const allowQuantity = product.customFields?.some(f => f.name === 'quantity') || product.type === 'app';
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
    const newQty = parseInt(e.target.value) || 1;
    setQuantity(newQty);
    // تحديث customValues إذا كان هناك حقل quantity
    if (product.customFields?.some(f => f.name === 'quantity')) {
      setCustomValues(prev => ({ ...prev, quantity: newQty }));
    }
  };

  const imageUrl = product.imageUrl;

  return (
    <div className="unified-checkout product-page" dir="rtl">
      <div className="product-page__back">
        <GoBackButton text="رجوع" onClick={() => navigate(-1)} />
      </div>
      <div className="product-page__container">
        {/* الصورة */}
        <div className="product-page__image">
          {imageUrl ? <img src={imageUrl} alt={product.name} /> : <div className="image-placeholder">📦</div>}
        </div>

        {/* التفاصيل */}
        <div className="product-page__details">
          <h1 className="product-page__title">{product.name}</h1>
          {product.note && (
            <div className="product-page__note">
              <strong>ملاحظة المدير:</strong> {product.note}
            </div>
          )}

          {/* سعر الوحدة + الخصم */}
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

          {/* كارد الرصيد */}
          <div className={`balance-card ${isBalanceSufficient ? 'balance-sufficient' : 'balance-insufficient'}`}>
            <div className="balance-label">💰 رصيدك الحالي</div>
            <div className="balance-amount">{balance.toFixed(2)} $</div>
          </div>
          {!isBalanceSufficient && (
            <div className="balance-warning">{balanceStatusMessage}</div>
          )}

          <form onSubmit={handleSubmit} className="product-page__form">
            {/* حقل الكمية (للتطبيقات أو المنتجات التي تدعم الكمية) */}
            {allowQuantity && (
              <div className="form-group">
                <label>الكمية</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={handleQuantityChange}
                  className="quantity-input"
                />
                {discountPercent === 0 && (
                  <div className="price-update-info">يتغير السعر تلقائياً عند تغيير الكمية</div>
                )}
              </div>
            )}

            {/* الحقول الديناميكية الأخرى (مثل playerId) */}
            <DynamicFields
              fields={(product.customFields || []).filter(f => f.name !== 'quantity')}
              onChange={setCustomValues}
              initialValues={customValues}
            />

            {/* السعر الإجمالي */}
            <div className="product-page__total">
              <span>الإجمالي:</span>
              <strong>{displayTotalPrice}</strong>
            </div>

            {error && <div className="error-message">{error}</div>}

            <Button 
              type="submit" 
              disabled={loading || !isBalanceSufficient} 
              className="buy-button"
            >
              {loading ? 'جاري التنفيذ...' : `تأكيد الشراء (${displayTotalPrice})`}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}