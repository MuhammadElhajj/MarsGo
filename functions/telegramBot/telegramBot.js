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

// ================================================================
//  الدوال المساعدة (بدون parse_mode لتجنب الأخطاء)
// ================================================================

/**
 * الرد على استعلام الزر (callback_query)
 */
async function answerCallback(callbackId, text, showAlert = false) {
  const token = BOT_TOKEN_SECRET.value();
  const url = `https://api.telegram.org/bot${token}/answerCallbackQuery`;
  try {
    await axios.post(url, {
      callback_query_id: callbackId,
      text: text,
      show_alert: showAlert,
    });
    console.log(`✅ answerCallback: "${text}" (showAlert=${showAlert})`);
  } catch (error) {
    console.error('❌ فشل الرد على الاستعلام:', error.response?.data || error.message);
  }
}

/**
 * إزالة الأزرار من الرسالة
 */
async function removeButtons(chatId, messageId) {
  const token = BOT_TOKEN_SECRET.value();
  const url = `https://api.telegram.org/bot${token}/editMessageReplyMarkup`;
  try {
    await axios.post(url, {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: {},
    });
    console.log(`✅ تم إزالة الأزرار من ${messageId}`);
  } catch (error) {
    console.error('❌ فشل إزالة الأزرار:', error.response?.data || error.message);
  }
}

/**
 * إرسال رسالة نصية (بدون parse_mode)
 */
async function sendMessage(chatId, text) {
  const token = BOT_TOKEN_SECRET.value();
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  try {
    await axios.post(url, {
      chat_id: chatId,
      text: text,
      // لا نستخدم parse_mode لتجنب الأخطاء
    });
    console.log(`✅ تم إرسال الرسالة إلى ${chatId}`);
    return true;
  } catch (error) {
    console.error('❌ فشل إرسال الرسالة:', error.response?.data || error.message);
    return false;
  }
}

function getUserIdFromUpdate(update) {
  if (update.message) {
    return update.message.from.id.toString().replace(/\D/g, '');
  }
  if (update.callback_query) {
    return update.callback_query.from.id.toString().replace(/\D/g, '');
  }
  return null;
}

// ================================================================
//  دالة Webhook الرئيسية
// ================================================================

exports.telegramDepositWebhook = functions.https.onRequest(
  { secrets: [BOT_TOKEN_SECRET, ALLOWED_IDS_SECRET] },
  async (req, res) => {
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }

    const update = req.body;
    console.log('📨 Webhook received:', JSON.stringify(update));

    const userId = getUserIdFromUpdate(update);
    let chatId = null;
    let messageId = null;

    if (update.message) {
      chatId = update.message.chat.id;
    } else if (update.callback_query) {
      chatId = update.callback_query.message.chat.id;
      messageId = update.callback_query.message.message_id;
    }

    if (!userId) {
      console.warn('⚠️ لا يمكن تحديد المستخدم');
      return res.sendStatus(200);
    }

    // ===== التحقق من الصلاحية =====
    const allowedIdsRaw = ALLOWED_IDS_SECRET.value();
    const allowedIds = allowedIdsRaw
      .split(',')
      .map(id => id.trim().replace(/\D/g, ''))
      .filter(id => id.length > 0);

    console.log(`🔍 التحقق: userId=${userId}, allowed=${JSON.stringify(allowedIds)}`);

    if (!allowedIds.includes(userId)) {
      console.log(`⛔ مستخدم غير مصرح: ${userId}`);
      if (update.message) {
        await sendMessage(chatId, '⛔ عذراً، هذا البوت مخصص للإدارة فقط.');
      } else if (update.callback_query) {
        await answerCallback(update.callback_query.id, '⛔ غير مصرح', true);
      }
      return res.sendStatus(200);
    }

    // ===== معالجة الأوامر النصية =====
    if (update.message && update.message.text) {
      const text = update.message.text.trim();
      if (text === '/start') {
        // رسالة ترحيب ثابتة بدون تنسيق
        const welcome = `👋 مرحباً بك في بوت الإدارة!\n🔹 يمكنك إدارة طلبات الإيداع.\n🔹 ستظهر لك الأزرار عند وصول طلب جديد.\n🔹 اضغط على الزر المناسب لاتخاذ الإجراء.`;
        await sendMessage(chatId, welcome);
        return res.sendStatus(200);
      } else {
        // أي رسالة غير /start نوجه المستخدم
        await sendMessage(chatId, '❓ أمر غير معروف. استخدم /start للبدء.');
        return res.sendStatus(200);
      }
    }

    // ===== معالجة الأزرار (callback_query) =====
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

      console.log(`📌 الإجراء: ${action}, النوع: ${type}, المعرف: ${docId}`);

      if (type !== 'deposit') {
        await answerCallback(callbackId, '⚠️ نوع غير معروف', true);
        return res.sendStatus(200);
      }

      // ===== معالجة طلب الإيداع =====
      const depositRef = db.collection('topUpRequests').doc(docId);
      let depositSnap;
      try {
        depositSnap = await depositRef.get();
        console.log(`📄 قراءة المستند: exists=${depositSnap.exists}`);
      } catch (err) {
        console.error('❌ خطأ في قراءة Firestore:', err);
        await answerCallback(callbackId, '❌ خطأ في قاعدة البيانات', true);
        return res.sendStatus(200);
      }

      if (!depositSnap.exists) {
        await answerCallback(callbackId, '⚠️ طلب الإيداع غير موجود', true);
        return res.sendStatus(200);
      }

      const deposit = depositSnap.data();
      console.log(`📊 حالة الإيداع: ${deposit.status}`);

      if (deposit.status !== 'pending') {
        await answerCallback(callbackId, `⚠️ تمت معالجته مسبقاً (${deposit.status})`, true);
        if (chatId && messageId) {
          await removeButtons(chatId, messageId);
        }
        return res.sendStatus(200);
      }

      try {
        if (action === 'approve') {
          await answerCallback(callbackId, `⏳ جاري معالجة ${deposit.amount} $...`, false);

          await db.runTransaction(async (transaction) => {
            const userRef = db.collection('users').doc(deposit.userId);
            const userSnap = await transaction.get(userRef);
            if (!userSnap.exists) throw new Error('المستخدم غير موجود');
            const newBalance = (userSnap.data()?.balance || 0) + deposit.amount;
            transaction.update(userRef, { balance: newBalance });
            transaction.update(depositRef, {
              status: 'approved',
              approvedAt: admin.firestore.FieldValue.serverTimestamp(),
              approvedBy: userId,
            });
          });

          // إشعار للمستخدم
          const userRef = db.collection('users').doc(deposit.userId);
          const userSnap = await userRef.get();
          const userData = userSnap.data();
          if (userData?.telegramChatId) {
            await sendMessage(userData.telegramChatId, `💰 تم إضافة ${deposit.amount} $ إلى رصيدك.`);
          }

          await answerCallback(callbackId, `✅ تمت الموافقة على ${deposit.amount} $`, false);

        } else if (action === 'reject') {
          await answerCallback(callbackId, `⏳ جاري رفض ${deposit.amount} $...`, false);

          await depositRef.update({
            status: 'rejected',
            rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
            rejectedBy: userId,
          });

          const userRef = db.collection('users').doc(deposit.userId);
          const userSnap = await userRef.get();
          const userData = userSnap.data();
          if (userData?.telegramChatId) {
            await sendMessage(userData.telegramChatId, `❌ تم رفض إيداعك بقيمة ${deposit.amount} $.`);
          }

          await answerCallback(callbackId, `❌ تم رفض ${deposit.amount} $`, false);
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
