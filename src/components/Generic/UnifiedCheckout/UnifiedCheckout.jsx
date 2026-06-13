import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  const { productId } = useParams(); // المنتج من الرابط
  const { userData } = useAuth();
  const navigate = useNavigate();
  
  // Zustand store
  const balance = useAppStore((state) => state.balance);
  const deductBalance = useAppStore((state) => state.deductBalance);
  const addNotification = useAppStore((state) => state.addNotification);
  const currency = useAppStore((state) => state.currency);
  const exchangeRate = useAppStore((state) => state.exchangeRate);
  const products = useAppStore((state) => state.products);
  const fetchProducts = useAppStore((state) => state.fetchProducts); // تأكد من وجودها

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [customValues, setCustomValues] = useState({});
  const [quantity, setQuantity] = useState(1);

  // جلب المنتج من الـ store (أو من Firestore إذا لم يكن موجوداً)
  const product = useMemo(() => products.find(p => p.id === productId), [products, productId]);

  // إذا لم يكن المنتج في الـ store، قم بجلبه
  useEffect(() => {
    if (productId && !product) {
      fetchProducts(); // تفترض أن fetchProducts تجلب كل المنتجات من Firestore
    }
  }, [productId, product, fetchProducts]);

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

  if (!product) return <Loading text="جاري تحميل المنتج..." />;

  // تحديد ما إذا كان المنتج يسمح بتغيير الكمية (بناءً على وجود حقل quantity في customFields أو نوعه)
  const allowQuantity = product.customFields?.some(f => f.name === 'quantity') || product.type === 'app';

  // حساب السعر الإجمالي (مع مراعاة الكمية)
  const unitPrice = product.price || 0;
  const totalPrice = unitPrice * (allowQuantity ? quantity : 1);
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
    priceUSD: unitPrice,
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

      // (اختياري) إذا كان المنتج مرتبطاً بمتجر خارجي، يمكن استدعاء externalStoreProxy هنا
      let externalResult = null;
      if (product.externalStore?.enabled) {
        // مثال: const proxyFunc = httpsCallable(functions, 'externalStoreProxy');
        // externalResult = await proxyFunc({ productId: product.id, ...customValues, quantity });
        // يمكنك تنفيذ ذلك لاحقاً
        console.log('طلب منتج خارجي', product.externalStore);
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