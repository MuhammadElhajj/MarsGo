// functions/notifications/telegram.js
const { onCall } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const axios = require("axios");

// تعريف الأسرار
const TELEGRAM_BOT_TOKEN = defineSecret("TELEGRAM_BOT_TOKEN");
const TELEGRAM_DEPOSIT_BOT_TOKEN = defineSecret("TELEGRAM_DEPOSIT_BOT_TOKEN");
const TELEGRAM_RECIPIENT_IDS = defineSecret("TELEGRAM_RECIPIENT_IDS");

/**
 * دالة عامة لإرسال رسالة تلغرام مع أزرار
 */
async function sendTelegramMessage(chatId, token, message, inlineKeyboard = null) {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const payload = {
    chat_id: chatId,
    text: message,
    parse_mode: 'Markdown',
  };
  if (inlineKeyboard) {
    payload.reply_markup = inlineKeyboard;
  }
  const response = await axios.post(url, payload);
  return response.data;
}

/**
 * دالة إرسال إشعارات الطلبات (للمدققين)
 */
exports.sendOrderNotification = onCall(
  { 
    cors: true, 
    secrets: [TELEGRAM_BOT_TOKEN, TELEGRAM_RECIPIENT_IDS] 
  },
  async (request) => {
    if (!request.auth) {
      throw new Error("غير مصرح");
    }

    const { orderId, message, type = 'order' } = request.data;
    if (!orderId || !message) {
      throw new Error("بيانات غير مكتملة");
    }

    const token = TELEGRAM_BOT_TOKEN.value();
    const chatIds = TELEGRAM_RECIPIENT_IDS.value().split(',');

    // إنشاء أزرار للمدققين
    const inlineKeyboard = {
      inline_keyboard: [
        [
          { text: '✅ تأكيد', callback_data: `verify_order_${orderId}` },
          { text: '❌ رفض', callback_data: `reject_order_${orderId}` }
        ]
      ]
    };

    const results = await Promise.allSettled(
      chatIds.map(chatId => 
        sendTelegramMessage(chatId.trim(), token, message, inlineKeyboard)
      )
    );

    const failed = results.filter(r => r.status === 'rejected').length;
    if (failed > 0) {
      console.warn(`فشل إرسال إشعار الطلب ${orderId} إلى ${failed} مستلم`);
    }

    return { success: true, sentTo: chatIds.length, failed };
  }
);

/**
 * دالة إرسال إشعارات الإيداع (للمدقق المالي)
 */
exports.sendDepositNotification = onCall(
  { 
    cors: true, 
    secrets: [TELEGRAM_DEPOSIT_BOT_TOKEN, TELEGRAM_RECIPIENT_IDS] 
  },
  async (request) => {
    if (!request.auth) {
      throw new Error("غير مصرح");
    }

    const { depositId, message, amount, userName, paymentMethod } = request.data;
    if (!depositId || !message) {
      throw new Error("بيانات غير مكتملة");
    }

    const token = TELEGRAM_DEPOSIT_BOT_TOKEN.value();
    const chatIds = TELEGRAM_RECIPIENT_IDS.value().split(',');

    // أزرار للمدقق المالي
    const inlineKeyboard = {
      inline_keyboard: [
        [
          { text: '✅ تأكيد الإيداع', callback_data: `approve_deposit_${depositId}` },
          { text: '❌ رفض الإيداع', callback_data: `reject_deposit_${depositId}` }
        ]
      ]
    };

    const results = await Promise.allSettled(
      chatIds.map(chatId => 
        sendTelegramMessage(chatId.trim(), token, message, inlineKeyboard)
      )
    );

    const failed = results.filter(r => r.status === 'rejected').length;
    if (failed > 0) {
      console.warn(`فشل إرسال إشعار الإيداع ${depositId} إلى ${failed} مستلم`);
    }

    return { success: true, sentTo: chatIds.length, failed };
  }
);