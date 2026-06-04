
// دالة مساعدة لتحويل Base64 إلى Blob
// src/utils/sendWhatsAppNotification.js
// إرسال إشعارات عبر Telegram Bot API (يدعم النص والصور)

// إرسال رسالة نصية فقط
export async function sendTelegramMessage(chatId, message) {
  const botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
  if (!botToken) return false;
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'Markdown' })
    });
    const data = await res.json();
    return res.ok && data.ok;
  } catch (err) {
    console.error(err);
    return false;
  }
}

// إرسال صورة + نص (caption)
export async function sendTelegramPhoto(chatId, photoBase64, caption) {
  const botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
  if (!botToken) return false;
  
  // تحويل base64 إلى Blob
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
    if (res.ok && data.ok) {
      console.log('✅ Photo sent to Telegram');
      return true;
    } else {
      console.error('❌ Telegram photo send failed:', data);
      return false;
    }
  } catch (err) {
    console.error(err);
    return false;
  }
}

// helper: تحويل base64 إلى Blob
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

// الدالة الرئيسية (تُستخدم في صفحات الطلب) - تدعم صورة اختيارية
export async function sendWhatsAppNotification(phoneNumber, message, photoBase64 = null) {
  const adminChatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;
  if (!adminChatId) {
    console.warn('⚠️ Missing admin chat ID');
    return false;
  }
  if (photoBase64) {
    // إرسال الصورة + النص كـ caption
    return await sendTelegramPhoto(adminChatId, photoBase64, message);
  } else {
    // إرسال نص فقط
    return await sendTelegramMessage(adminChatId, message);
  }
}

// دالة تنسيق الرسالة (كما هي)
export function formatOrderMessage(orderData, orderId, type) {
  const shortId = orderId.slice(-6);
  const date = new Date().toLocaleString('ar-SY');

  if (type === 'gaming') {
    return `📦 *طلب شحن ألعاب جديد* 📦
🆔 رقم الطلب: #${shortId}
🎮 اللعبة: ${orderData.itemName}
📦 الباقة: ${orderData.packageName}
🆔 معرف الحساب: ${orderData.playerId}
💰 المبلغ: ${orderData.finalPriceUSD || orderData.finalPrice} ${orderData.currencyUsed === 'USD' ? '$' : (orderData.currency || 'USD')}
👤 العميل: ${orderData.customerName}
📅 التاريخ: ${date}`;
  }

  if (type === 'apps') {
  return `📦 *طلب شحن تطبيق جديد* 📦
🆔 رقم الطلب: #${shortId}
🎮 اللعبة: ${orderData.itemName}
📦 الباقة: ${orderData.packageName}
🆔 معرف الحساب: ${orderData.playerId}
💰 المبلغ: ${orderData.finalPriceUSD || orderData.finalPrice} ${orderData.currencyUsed === 'USD' ? '$' : (orderData.currency || 'USD')}
👤 العميل: ${orderData.customerName}
📅 التاريخ: ${date}`;
  }

  if (type === 'transfer') {
    return `💸 *طلب تحويل شام كاش جديد* 💸
🆔 رقم الطلب: #${shortId}
👤 المستلم: ${orderData.recipientName}
📞 رقم شام كاش: ${orderData.shamCashPhone}
💰 المبلغ: ${orderData.amount} $
👤 العميل: ${orderData.customerName}
📅 التاريخ: ${date}`;
  }

  if (type === 'crypto') {
    return `₿ *طلب عملات رقمية جديد* ₿
🆔 رقم الطلب: #${shortId}
🔄 نوع العملية: ${orderData.tradeType === 'buy' ? 'شراء' : 'بيع'}
💰 الكمية: ${orderData.amount} USDT
💵 السعر: ${orderData.price} $
👤 العميل: ${orderData.customerName}
📅 التاريخ: ${date}`;
  }

  if (type === 'exchange') {
    return `🔄 *طلب صرافة شام كاش جديد* 🔄
🆔 رقم الطلب: #${shortId}
💱 نوع الصرافة: ${orderData.exchangeType === 'buy_dollar' ? 'شراء دولار' : 'بيع دولار'}
💰 المبلغ: ${orderData.amount}
💲 السعر: ${orderData.rate}
👤 العميل: ${orderData.customerName}
📅 التاريخ: ${date}`;
  }

  return `📋 *طلب جديد* #${shortId}\n${JSON.stringify(orderData)}`;
}