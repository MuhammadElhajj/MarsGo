// src/components/Generic/UnifiedCheckout/hooks/useOrderSubmission.js
import { useAuth } from '../../../../context/AuthContext';
import { useBalance } from '../../../../context/BalanceContext';
import { useExchangeRate } from '../../../../context/ExchangeRateContext';
import { useCurrency } from '../../../../context/CurrencyContext';
import { useNotifications } from '../../../../context/NotificationContext';
import { db } from '../../../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { sendWhatsAppNotification, formatOrderMessage } from '../../../../utils/sendWhatsAppNotification';
import { showToast } from '../../../GeneralComponents/ToastNotification/ToastNotification';

export function useOrderSubmission(serviceType) {
  const { userData } = useAuth();
  const { deductBalance } = useBalance();
  const { rate } = useExchangeRate();
  const { currency } = useCurrency();
  const { addNotification } = useNotifications();

  const submitOrder = async (formData, item, pkg) => {
    // بناء بيانات الطلب
    let orderData = {
      userId: userData.uid,
      customerName: userData.name || '',
      type: serviceType,
      status: 'completed',
      paidByBalance: true,
      createdAt: serverTimestamp(),
    };

    // إضافة الحقول الخاصة حسب الخدمة
    switch (serviceType) {
      case 'gaming':
      case 'apps':
        orderData = {
          ...orderData,
          itemId: item.id,
          itemName: item.name,
          packageId: pkg.id,
          packageName: pkg.name,
          priceUSD: formData.requiredAmountUSD,
          finalPriceUSD: formData.requiredAmountUSD,
          exchangeRateAtPurchase: rate || null,
          currencyUsed: currency,
          playerId: formData.playerId,
        };
        break;
      case 'transfer':
        orderData = {
          ...orderData,
          recipientName: formData.recipientName,
          shamCashPhone: formData.shamCashPhone,
          amount: parseFloat(formData.amount),
        };
        break;
      case 'crypto':
        orderData = {
          ...orderData,
          tradeType: formData.tradeType,
          amount: parseFloat(formData.amount),
          price: parseFloat(formData.price),
          paymentMethod: formData.paymentMethod,
        };
        break;
      case 'exchange':
        orderData = {
          ...orderData,
          exchangeType: formData.exchangeType,
          amount: parseFloat(formData.amount),
          rate: parseFloat(formData.rateExchange),
        };
        break;
      default:
        throw new Error('نوع الخدمة غير معروف');
    }

    const docRef = await addDoc(collection(db, 'orders'), orderData);

    // إشعار واتساب
    let orderMessageData = {};
    switch (serviceType) {
      case 'gaming':
      case 'apps':
        orderMessageData = {
          itemName: item.name,
          packageName: pkg.name,
          playerId: formData.playerId,
          finalPriceUSD: formData.requiredAmountUSD,
          currencyUsed: currency,
          customerName: userData.name || '',
        };
        break;
      case 'transfer':
        orderMessageData = { recipientName: formData.recipientName, shamCashPhone: formData.shamCashPhone, amount: formData.amount, customerName: userData.name || '' };
        break;
      case 'crypto':
        orderMessageData = { tradeType: formData.tradeType, amount: formData.amount, price: formData.price, customerName: userData.name || '' };
        break;
      case 'exchange':
        orderMessageData = { exchangeType: formData.exchangeType, amount: formData.amount, rate: formData.rateExchange, customerName: userData.name || '' };
        break;
    }
    const message = formatOrderMessage(orderMessageData, docRef.id, serviceType);
    await sendWhatsAppNotification(null, message, null);

    // إشعار داخلي
    await addNotification(
      userData.uid,
      '✅ طلب مكتمل',
      `طلب #${docRef.id.slice(-6)} - تم خصم ${formData.requiredAmountUSD.toFixed(2)} $ من رصيدك`,
      'order_completed',
      docRef.id,
      '/my-orders'
    );

    showToast(`✅ تم تنفيذ طلبك بنجاح! تم خصم ${formData.requiredAmountUSD.toFixed(2)} $ من رصيدك.`, 'success', 4000);
    return docRef.id;
  };

  const deductBalanceAndValidate = async (requiredAmountUSD) => {
    const { balance } = useBalance(); // لا يمكن استخدام hook هنا لأننا داخل hook آخر، يجب تمرير balance كمعامل
    // سنقوم بتمرير balance من المكون الرئيسي
  };

  return { submitOrder };
}