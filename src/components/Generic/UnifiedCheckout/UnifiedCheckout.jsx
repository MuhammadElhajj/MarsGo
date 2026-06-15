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

  // استقبال بيانات الباقة المحلية من location.state
  const { item, pkg, serviceType } = location.state || {};

  // تحديد ما إذا كنا في حالة باقة محلية
  const isLocalPackage = item && pkg && serviceType;

  // بناء كائن المنتج (product) ديناميكياً
  const product = useMemo(() => {
    if (isLocalPackage) {
      // دمج بيانات اللعبة/التطبيق مع الباقة
      const customFields = item.customFields || [];
      // إذا كان type = 'game' نضيف حقل playerId افتراضياً إذا لم يوجد
      if (serviceType === 'gaming' && !customFields.some(f => f.name === 'playerId')) {
        customFields.push({
          label: 'معرف اللاعب (Player ID)',
          name: 'playerId',
          type: 'text',
          required: true,
          placeholder: 'أدخل معرف اللاعب'
        });
      }
      // إذا كان type = 'apps' نضيف حقل quantity افتراضياً إذا لم يوجد
      if (serviceType === 'apps' && !customFields.some(f => f.name === 'quantity')) {
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
        imageUrl: pkg.imageUrl || item.imageUrl || '',
        customFields: customFields,
        type: serviceType === 'gaming' ? 'game' : 'app',
        categoryId: serviceType === 'gaming' ? 'games' : 'apps',
        externalStore: null // ليس منتجاً خارجياً
      };
    } else if (productId) {
      return products.find(p => p.id === productId) || null;
    }
    return null;
  }, [productId, products, isLocalPackage, item, pkg, serviceType]);

  // جلب المنتجات من Firestore إذا لم تكن موجودة في الـ store
  useEffect(() => {
    if (productId && !product && !isLocalPackage) {
      fetchProducts();
    }
  }, [productId, product, isLocalPackage, fetchProducts]);

  // تهيئة القيم الافتراضية من customFields
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

  if (!product) {
    if (isLocalPackage) return <Loading text="جاري تحميل الباقة..." />;
    return <Loading text="جاري تحميل المنتج..." />;
  }

  // تحديد ما إذا كان المنتج يسمح بتغيير الكمية
  const allowQuantity = product.customFields?.some(f => f.name === 'quantity') || product.type === 'app';

  // حساب السعر الإجمالي (مع مراعاة الخصم إن وجد)
  const basePrice = product.price || 0;
  const discountPercent = product.discount || 0;
  const discountedPrice = discountPercent > 0 ? basePrice * (1 - discountPercent / 100) : basePrice;
  const totalPrice = discountedPrice * (allowQuantity ? quantity : 1);
  const displayPrice = currency === 'USD'
    ? `${totalPrice.toFixed(2)} $`
    : exchangeRate ? `${(totalPrice * exchangeRate).toFixed(0).toLocaleString()} ل.س` : '...';

  // التحقق من صحة الحقول المطلوبة
  const validateForm = () => {
    const missing = product.customFields?.filter(f => f.required && !customValues[f.name]) || [];
    if (missing.length) {
      return `يرجى ملء: ${missing.map(m => m.label).join(', ')}`;
    }
    if (balance < totalPrice) {
      return `رصيدك غير كافٍ. المطلوب: ${totalPrice.toFixed(2)} $، رصيدك: ${balance.toFixed(2)} $`;
    }
    return null;
  };

  // تجميع بيانات الطلب
  const getOrderData = (externalResult = null) => ({
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
    ...(externalResult && { externalOrderId: externalResult.order_id, externalData: externalResult })
  });

  // إرسال الطلب
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
      // خصم الرصيد
      const deducted = await deductBalance(totalPrice);
      if (!deducted) throw new Error('فشل خصم الرصيد');

      // (اختياري) إذا كان المنتج مرتبطاً بمتجر خارجي
      let externalResult = null;
      if (product.externalStore?.enabled) {
        console.log('طلب منتج خارجي', product.externalStore);
        // يمكنك استدعاء externalStoreProxy هنا
      }

      const orderData = getOrderData(externalResult);
      const docRef = await addDoc(collection(db, 'orders'), orderData);

      // إشعار واتساب
      const orderMessageData = {
        productName: product.name,
        quantity: allowQuantity ? quantity : 1,
        customValues,
        totalPrice,
        customerName: userData.name || ''
      };
      const message = formatOrderMessage(orderMessageData, docRef.id, 'product');
      await sendWhatsAppNotification(null, message, null);

      // إشعار داخلي
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

  return (
    <div className="unified-checkout" dir="rtl">
      <GoBackButton text="رجوع" onClick={() => navigate(-1)} />
      <h2 className="unified-checkout__title">{product.name}</h2>
      {product.imageUrl && <img src={product.imageUrl} alt={product.name} className="product-image" />}
      <div className="unified-checkout__form">
        <form onSubmit={handleSubmit}>
          {allowQuantity && (
            <div className="form-group">
              <label>الكمية</label>
              <input
                type="number"
                min={1}
                className="form-control"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              />
            </div>
          )}
          <DynamicFields
            fields={product.customFields || []}
            onChange={setCustomValues}
            initialValues={customValues}
          />
          <p className="price-display">السعر الإجمالي: {displayPrice}</p>
          <Button type="submit" disabled={loading || balance < totalPrice}>
            {loading ? 'جاري التنفيذ...' : `تأكيد الطلب (${totalPrice.toFixed(2)} $)`}
          </Button>
          {error && <p className="error">❌ {error}</p>}
        </form>
      </div>
    </div>
  );
}