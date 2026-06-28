// functions/telegramBot/telegramBot.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');
const { defineSecret } = require('firebase-functions/params');

// ===== تعريف الأسرار =====
const BOT_TOKEN_SECRET = defineSecret('TELEGRAM_DEPOSIT_BOT_TOKEN');
const ALLOWED_IDS_SECRET = defineSecret('ALLOWED_TELEGRAM_IDS');

// ===== تهيئة Firebase Admin =====
if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();

// ===== الدوال المساعدة =====

async function answerCallback(callbackId, text, showAlert = false) {
  const token = BOT_TOKEN_SECRET.value();
  const url = `https://api.telegram.org/bot${token}/answerCallbackQuery`;
  try {
    await axios.post(url, {
      callback_query_id: callbackId,
      text: text,
      show_alert: showAlert,
    });
  } catch (error) {
    console.error('❌ فشل الرد على الاستعلام:', error.message);
  }
}

async function removeButtons(chatId, messageId) {
  const token = BOT_TOKEN_SECRET.value();
  const url = `https://api.telegram.org/bot${token}/editMessageReplyMarkup`;
  try {
    await axios.post(url, {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: {},
    });
  } catch (error) {
    console.error('❌ فشل إزالة الأزرار:', error.message);
  }
}

async function sendMessage(chatId, text, parseMode = null) {
  const token = BOT_TOKEN_SECRET.value();
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const payload = {
    chat_id: chatId,
    text: text,
  };
  if (parseMode) {
    payload.parse_mode = parseMode;
  }
  try {
    await axios.post(url, payload);
    console.log(`✅ تم إرسال الرسالة إلى ${chatId}`);
    return true;
  } catch (error) {
    console.error('❌ فشل إرسال الرسالة:', error.response?.data || error.message);
    // محاولة إرسال بدون parse_mode كحل احتياطي
    if (parseMode) {
      try {
        delete payload.parse_mode;
        await axios.post(url, payload);
        console.log(`✅ تم إرسال الرسالة (بدون تنسيق) إلى ${chatId}`);
        return true;
      } catch (retryError) {
        console.error('❌ فشل حتى بدون تنسيق:', retryError.message);
        return false;
      }
    }
    return false;
  }
}

// ===== دالة الـ Webhook الرئيسية =====
exports.telegramDepositWebhook = functions.https.onRequest(
  { secrets: [BOT_TOKEN_SECRET, ALLOWED_IDS_SECRET] },
  async (req, res) => {
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }

    const update = req.body;
    console.log('📨 Webhook received:', JSON.stringify(update));

    let userId = null;
    let chatId = null;
    let messageId = null;

    if (update.message) {
      userId = update.message.from.id.toString().replace(/\D/g, '');
      chatId = update.message.chat.id;
    } else if (update.callback_query) {
      userId = update.callback_query.from.id.toString().replace(/\D/g, '');
      chatId = update.callback_query.message.chat.id;
      messageId = update.callback_query.message.message_id;
    }

    if (!userId) {
      console.warn('⚠️ لا يمكن تحديد المستخدم');
      return res.sendStatus(200);
    }

    // التحقق من الصلاحية
    const allowedIds = ALLOWED_IDS_SECRET.value()
      .split(',')
      .map(id => id.trim().replace(/\D/g, ''))
      .filter(id => id.length > 0);

    if (!allowedIds.includes(userId)) {
      console.log(`⛔ مستخدم غير مصرح: ${userId}`);
      if (update.message) {
        await sendMessage(chatId, '⛔ عذراً، هذا البوت مخصص للإدارة فقط.');
      }
      return res.sendStatus(200);
    }

    // معالجة الأوامر النصية
    if (update.message && update.message.text) {
      const text = update.message.text.trim();
      if (text === '/start') {
        const welcomeText = 
`👋 مرحباً بك في بوت الإدارة!

🔹 يمكنك استخدام هذا البوت لإدارة طلبات الإيداع.
🔹 ستظهر لك الإشعارات مع أزرار التأكيد والرفض.
🔹 اضغط على الزر المناسب لاتخاذ الإجراء.

📌 ملاحظة: هذا البوت مخصص للإدارة فقط.`;
        await sendMessage(chatId, welcomeText);
        return res.sendStatus(200);
      }
      await sendMessage(chatId, '❓ أمر غير معروف. استخدم /start للبدء.');
      return res.sendStatus(200);
    }

    // معالجة الأزرار
    if (update.callback_query) {
      const callback = update.callback_query;
      const data = callback.data;
      const callbackId = callback.id;

      console.log(`🔘 زر مضغوط: ${data}`);

      const parts = data.split('_');
      if (parts.length < 3) {
        await answerCallback(callbackId, '⚠️ بيانات غير صالحة', true);
        return res.sendStatus(200);
      }

      const action = parts[0];
      const type = parts[1];
      const docId = parts.slice(2).join('_');

      if (type !== 'deposit') {
        await answerCallback(callbackId, '⚠️ نوع غير معروف', true);
        return res.sendStatus(200);
      }

      const depositRef = db.collection('topUpRequests').doc(docId);
      let depositSnap;
      try {
        depositSnap = await depositRef.get();
      } catch (err) {
        console.error('❌ خطأ في قراءة Firestore:', err);
        await answerCallback(callbackId, '❌ حدث خطأ في قاعدة البيانات', true);
        return res.sendStatus(200);
      }

      if (!depositSnap.exists) {
        await answerCallback(callbackId, '⚠️ طلب الإيداع غير موجود', true);
        return res.sendStatus(200);
      }

      const deposit = depositSnap.data();
      if (deposit.status !== 'pending') {
        await answerCallback(callbackId, `⚠️ تمت معالجة هذا الطلب مسبقاً (الحالة: ${deposit.status})`, true);
        if (chatId && messageId) {
          await removeButtons(chatId, messageId);
        }
        return res.sendStatus(200);
      }

      try {
        if (action === 'approve') {
          await answerCallback(callbackId, `⏳ جاري معالجة طلب ${deposit.amount} $...`, false);

          await db.runTransaction(async (transaction) => {
            const userRef = db.collection('users').doc(deposit.userId);
            const userSnap = await transaction.get(userRef);
            if (!userSnap.exists) throw new Error('المستخدم غير موجود');
            const currentBalance = userSnap.data()?.balance || 0;
            const newBalance = currentBalance + deposit.amount;
            transaction.update(userRef, { balance: newBalance });
            transaction.update(depositRef, {
              status: 'approved',
              approvedAt: admin.firestore.FieldValue.serverTimestamp(),
              approvedBy: userId,
            });
          });

          const userRef = db.collection('users').doc(deposit.userId);
          const userSnap = await userRef.get();
          const userData = userSnap.data();
          if (userData?.telegramChatId) {
            await sendMessage(userData.telegramChatId, `💰 تم إضافة ${deposit.amount} $ إلى رصيدك بنجاح.`);
          }

          await answerCallback(callbackId, `✅ تمت الموافقة على إيداع ${deposit.amount} $`, false);

        } else if (action === 'reject') {
          await answerCallback(callbackId, `⏳ جاري رفض طلب ${deposit.amount} $...`, false);

          await depositRef.update({
            status: 'rejected',
            rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
            rejectedBy: userId,
          });

          const userRef = db.collection('users').doc(deposit.userId);
          const userSnap = await userRef.get();
          const userData = userSnap.data();
          if (userData?.telegramChatId) {
            await sendMessage(userData.telegramChatId, `❌ عذراً، تم رفض طلب إيداعك بقيمة ${deposit.amount} $.`);
          }

          await answerCallback(callbackId, `❌ تم رفض إيداع ${deposit.amount} $`, false);
        }

        if (chatId && messageId) {
          await removeButtons(chatId, messageId);
        }

      } catch (error) {
        console.error('❌ خطأ أثناء تنفيذ الإجراء:', error);
        await answerCallback(callbackId, `❌ حدث خطأ: ${error.message}`, true);
      }

      return res.sendStatus(200);
    }

    console.log('ℹ️ تحديث غير معالج:', update);
    res.sendStatus(200);
  }
);