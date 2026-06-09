// src/utils/depositBot.js
// دوال مساعدة لإرسال إشعارات طلبات الإيداع إلى تيلجرام (مع أزرار تفاعلية)

/**
 * تحويل base64 إلى Blob (لإرسال الصور)
 */
function dataURItoBlob(dataURI) {
  const byteString = atob(dataURI.split(',')[1]);
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
}

/**
 * إرسال رسالة نصية مع أزرار إلى بوت الإيداع
 * @param {string} message - نص الرسالة
 * @param {string} requestId - معرف طلب الإيداع (ضروري للأزرار)
 * @returns {Promise<boolean>}
 */
export async function sendTelegramDepositMessage(message, requestId) {
  const botToken = import.meta.env.VITE_TELEGRAM_DEPOSIT_BOT_TOKEN;
  const recipients = import.meta.env.VITE_TELEGRAM_DEPOSIT_RECIPIENT_IDS;
  if (!botToken || !recipients) return false;

  const chatIds = recipients.split(',').map(id => id.trim());
  let allSuccess = true;

  const inlineKeyboard = {
    inline_keyboard: [
      [
        { text: '✅ تأكيد الإيداع', callback_data: `approve_deposit_${requestId}` },
        { text: '❌ رفض الإيداع', callback_data: `reject_deposit_${requestId}` }
      ]
    ]
  };

  for (const chatId of chatIds) {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown',
          reply_markup: inlineKeyboard
        })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) allSuccess = false;
    } catch (err) {
      console.error(err);
      allSuccess = false;
    }
  }
  return allSuccess;
}

/**
 * إرسال رسالة مع صورة إلى بوت الإيداع (بدون أزرار، تُستخدم للإيصالات إذا احتجنا)
 * @param {string} caption - النص المرافق للصورة
 * @param {string} photoBase64 - الصورة بصيغة base64
 * @returns {Promise<boolean>}
 */
export async function sendTelegramDepositPhoto(caption, photoBase64) {
  const botToken = import.meta.env.VITE_TELEGRAM_DEPOSIT_BOT_TOKEN;
  const recipients = import.meta.env.VITE_TELEGRAM_DEPOSIT_RECIPIENT_IDS;
  if (!botToken || !recipients) return false;

  const chatIds = recipients.split(',').map(id => id.trim());
  let allSuccess = true;

  for (const chatId of chatIds) {
    const blob = dataURItoBlob(photoBase64);
    const formData = new FormData();
    formData.append('chat_id', chatId);
    formData.append('photo', blob, 'receipt.jpg');
    if (caption) formData.append('caption', caption);
    formData.append('parse_mode', 'Markdown');

    const url = `https://api.telegram.org/bot${botToken}/sendPhoto`;
    try {
      const res = await fetch(url, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok || !data.ok) allSuccess = false;
    } catch (err) {
      console.error(err);
      allSuccess = false;
    }
  }
  return allSuccess;
}

/**
 * تنسيق رسالة طلب الإيداع
 * @param {object} depositData - بيانات الطلب (amount, userName, paymentMethod, transactionNumber, senderName)
 * @param {string} requestId - معرف الطلب
 * @returns {string}
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
📛 اسم المرسل: ${depositData.senderName || '—'}
📅 التاريخ: ${date}`;
}