// src/services/notificationService.js
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();

/**
 * إرسال إشعار طلب جديد للمدققين
 */
export async function notifyOrder(orderId, message) {
  const notifyOrderFn = httpsCallable(functions, 'sendOrderNotification');
  try {
    const result = await notifyOrderFn({ orderId, message });
    return result.data;
  } catch (error) {
    console.error('فشل إرسال إشعار الطلب:', error);
    throw error;
  }
}

/**
 * إرسال إشعار إيداع جديد للمدقق المالي
 */
export async function notifyDeposit(depositId, message, amount, userName, paymentMethod) {
  const notifyDepositFn = httpsCallable(functions, 'sendDepositNotification');
  try {
    const result = await notifyDepositFn({ 
      depositId, 
      message, 
      amount, 
      userName, 
      paymentMethod 
    });
    return result.data;
  } catch (error) {
    console.error('فشل إرسال إشعار الإيداع:', error);
    throw error;
  }
}

/**
 * تنسيق رسالة الإيداع لإرسالها عبر تلغرام
 */
export function formatDepositMessage(depositData, requestId) {
  const shortId = requestId.slice(-6);
  const date = new Date().toLocaleString('ar-SY');
  const methodMap = {
    usdt: 'USDT (تيثر)',
    shamCash: 'شام كاش',
    siretelCash: 'سيريتل كاش'
  };
  const methodName = methodMap[depositData.paymentMethod] || depositData.paymentMethod;

  return `💰 *طلب إيداع جديد* 💰
🆔 رقم الطلب: #${shortId}
💰 المبلغ: ${depositData.amount} $
👤 العميل: ${depositData.userName}
🏦 طريقة الدفع: ${methodName}
📄 رقم العملية: ${depositData.transactionNumber || '—'}
📅 التاريخ: ${date}`;
}