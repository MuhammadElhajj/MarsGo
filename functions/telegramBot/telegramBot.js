// // functions/telegramBot/telegramBot.js
// const functions = require('firebase-functions');
// const admin = require('firebase-admin');
// const axios = require('axios');
// const { defineSecret } = require('firebase-functions/params');

// // ===== تعريف الأسرار =====
// const BOT_TOKEN_SECRET = defineSecret('TELEGRAM_DEPOSIT_BOT_TOKEN');
// const ALLOWED_IDS_SECRET = defineSecret('ALLOWED_TELEGRAM_IDS');

// // ===== تهيئة Firebase Admin =====
// if (admin.apps.length === 0) {
//   admin.initializeApp();
// }
// const db = admin.firestore();

// // ================================================================
// //  الدوال المساعدة (بدون parse_mode لتجنب الأخطاء)
// // ================================================================

// /**
//  * الرد على استعلام الزر (callback_query)
//  */
// async function answerCallback(callbackId, text, showAlert = false) {
//   const token = BOT_TOKEN_SECRET.value();
//   const url = `https://api.telegram.org/bot${token}/answerCallbackQuery`;
//   try {
//     await axios.post(url, {
//       callback_query_id: callbackId,
//       text: text,
//       show_alert: showAlert,
//     });
//     console.log(`✅ answerCallback: "${text}" (showAlert=${showAlert})`);
//   } catch (error) {
//     console.error('❌ فشل الرد على الاستعلام:', error.response?.data || error.message);
//   }
// }

// /**
//  * إزالة الأزرار من الرسالة
//  */
// async function removeButtons(chatId, messageId) {
//   const token = BOT_TOKEN_SECRET.value();
//   const url = `https://api.telegram.org/bot${token}/editMessageReplyMarkup`;
//   try {
//     await axios.post(url, {
//       chat_id: chatId,
//       message_id: messageId,
//       reply_markup: {},
//     });
//     console.log(`✅ تم إزالة الأزرار من ${messageId}`);
//   } catch (error) {
//     console.error('❌ فشل إزالة الأزرار:', error.response?.data || error.message);
//   }
// }

// /**
//  * إرسال رسالة نصية (بدون parse_mode)
//  */
// async function sendMessage(chatId, text) {
//   const token = BOT_TOKEN_SECRET.value();
//   const url = `https://api.telegram.org/bot${token}/sendMessage`;
//   try {
//     await axios.post(url, {
//       chat_id: chatId,
//       text: text,
//       // لا نستخدم parse_mode لتجنب الأخطاء
//     });
//     console.log(`✅ تم إرسال الرسالة إلى ${chatId}`);
//     return true;
//   } catch (error) {
//     console.error('❌ فشل إرسال الرسالة:', error.response?.data || error.message);
//     return false;
//   }
// }

// function getUserIdFromUpdate(update) {
//   if (update.message) {
//     return update.message.from.id.toString().replace(/\D/g, '');
//   }
//   if (update.callback_query) {
//     return update.callback_query.from.id.toString().replace(/\D/g, '');
//   }
//   return null;
// }

// // ================================================================
// //  دالة Webhook الرئيسية
// // ================================================================

// exports.telegramDepositWebhook = functions.https.onRequest(
//   { secrets: [BOT_TOKEN_SECRET, ALLOWED_IDS_SECRET] },
//   async (req, res) => {
//     if (req.method !== 'POST') {
//       return res.status(405).send('Method Not Allowed');
//     }

//     const update = req.body;
//     console.log('📨 Webhook received:', JSON.stringify(update));

//     const userId = getUserIdFromUpdate(update);
//     let chatId = null;
//     let messageId = null;

//     if (update.message) {
//       chatId = update.message.chat.id;
//     } else if (update.callback_query) {
//       chatId = update.callback_query.message.chat.id;
//       messageId = update.callback_query.message.message_id;
//     }

//     if (!userId) {
//       console.warn('⚠️ لا يمكن تحديد المستخدم');
//       return res.sendStatus(200);
//     }

//     // ===== التحقق من الصلاحية =====
//     const allowedIdsRaw = ALLOWED_IDS_SECRET.value();
//     const allowedIds = allowedIdsRaw
//       .split(',')
//       .map(id => id.trim().replace(/\D/g, ''))
//       .filter(id => id.length > 0);

//     console.log(`🔍 التحقق: userId=${userId}, allowed=${JSON.stringify(allowedIds)}`);

//     if (!allowedIds.includes(userId)) {
//       console.log(`⛔ مستخدم غير مصرح: ${userId}`);
//       if (update.message) {
//         await sendMessage(chatId, '⛔ عذراً، هذا البوت مخصص للإدارة فقط.');
//       } else if (update.callback_query) {
//         await answerCallback(update.callback_query.id, '⛔ غير مصرح', true);
//       }
//       return res.sendStatus(200);
//     }

//     // ===== معالجة الأوامر النصية =====
//     if (update.message && update.message.text) {
//       const text = update.message.text.trim();
//       if (text === '/start') {
//         // رسالة ترحيب ثابتة بدون تنسيق
//         const welcome = `👋 مرحباً بك في بوت الإدارة!\n🔹 يمكنك إدارة طلبات الإيداع.\n🔹 ستظهر لك الأزرار عند وصول طلب جديد.\n🔹 اضغط على الزر المناسب لاتخاذ الإجراء.`;
//         await sendMessage(chatId, welcome);
//         return res.sendStatus(200);
//       } else {
//         // أي رسالة غير /start نوجه المستخدم
//         await sendMessage(chatId, '❓ أمر غير معروف. استخدم /start للبدء.');
//         return res.sendStatus(200);
//       }
//     }

//     // ===== معالجة الأزرار (callback_query) =====
//     if (update.callback_query) {
//       const callback = update.callback_query;
//       const data = callback.data;
//       const callbackId = callback.id;

//       console.log(`🔘 زر مضغوط: ${data}`);

//       const parts = data.split('_');
//       if (parts.length < 3) {
//         await answerCallback(callbackId, '⚠️ بيانات غير صالحة', true);
//         return res.sendStatus(200);
//       }

//       const action = parts[0];
//       const type = parts[1];
//       const docId = parts.slice(2).join('_');

//       console.log(`📌 الإجراء: ${action}, النوع: ${type}, المعرف: ${docId}`);

//       if (type !== 'deposit') {
//         await answerCallback(callbackId, '⚠️ نوع غير معروف', true);
//         return res.sendStatus(200);
//       }

//       // ===== معالجة طلب الإيداع =====
//       const depositRef = db.collection('topUpRequests').doc(docId);
//       let depositSnap;
//       try {
//         depositSnap = await depositRef.get();
//         console.log(`📄 قراءة المستند: exists=${depositSnap.exists}`);
//       } catch (err) {
//         console.error('❌ خطأ في قراءة Firestore:', err);
//         await answerCallback(callbackId, '❌ خطأ في قاعدة البيانات', true);
//         return res.sendStatus(200);
//       }

//       if (!depositSnap.exists) {
//         await answerCallback(callbackId, '⚠️ طلب الإيداع غير موجود', true);
//         return res.sendStatus(200);
//       }

//       const deposit = depositSnap.data();
//       console.log(`📊 حالة الإيداع: ${deposit.status}`);

//       if (deposit.status !== 'pending') {
//         await answerCallback(callbackId, `⚠️ تمت معالجته مسبقاً (${deposit.status})`, true);
//         if (chatId && messageId) {
//           await removeButtons(chatId, messageId);
//         }
//         return res.sendStatus(200);
//       }

//       try {
//         if (action === 'approve') {
//           await answerCallback(callbackId, `⏳ جاري معالجة ${deposit.amount} $...`, false);

//           await db.runTransaction(async (transaction) => {
//             const userRef = db.collection('users').doc(deposit.userId);
//             const userSnap = await transaction.get(userRef);
//             if (!userSnap.exists) throw new Error('المستخدم غير موجود');
//             const newBalance = (userSnap.data()?.balance || 0) + deposit.amount;
//             transaction.update(userRef, { balance: newBalance });
//             transaction.update(depositRef, {
//               status: 'approved',
//               approvedAt: admin.firestore.FieldValue.serverTimestamp(),
//               approvedBy: userId,
//             });
//           });

//           // إشعار للمستخدم
//           const userRef = db.collection('users').doc(deposit.userId);
//           const userSnap = await userRef.get();
//           const userData = userSnap.data();
//           if (userData?.telegramChatId) {
//             await sendMessage(userData.telegramChatId, `💰 تم إضافة ${deposit.amount} $ إلى رصيدك.`);
//           }

//           await answerCallback(callbackId, `✅ تمت الموافقة على ${deposit.amount} $`, false);

//         } else if (action === 'reject') {
//           await answerCallback(callbackId, `⏳ جاري رفض ${deposit.amount} $...`, false);

//           await depositRef.update({
//             status: 'rejected',
//             rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
//             rejectedBy: userId,
//           });

//           const userRef = db.collection('users').doc(deposit.userId);
//           const userSnap = await userRef.get();
//           const userData = userSnap.data();
//           if (userData?.telegramChatId) {
//             await sendMessage(userData.telegramChatId, `❌ تم رفض إيداعك بقيمة ${deposit.amount} $.`);
//           }

//           await answerCallback(callbackId, `❌ تم رفض ${deposit.amount} $`, false);
//         }

//         if (chatId && messageId) {
//           await removeButtons(chatId, messageId);
//         }

//       } catch (error) {
//         console.error('❌ خطأ أثناء تنفيذ الإجراء:', error);
//         await answerCallback(callbackId, `❌ حدث خطأ: ${error.message}`, true);
//       }

//       return res.sendStatus(200);
//     }

//     console.log('ℹ️ تحديث غير معالج:', update);
//     res.sendStatus(200);
//   }
// );
// functions/telegramBot/telegramBot.js
const { onRequest, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { logger } = require('firebase-functions/v2');
const admin = require('firebase-admin');

const TELEGRAM_DEPOSIT_BOT_TOKEN = defineSecret('TELEGRAM_DEPOSIT_BOT_TOKEN');

exports.telegramDepositWebhook = onRequest(
  { secrets: [TELEGRAM_DEPOSIT_BOT_TOKEN] },
  async (request, response) => {
    try {
      const botToken = TELEGRAM_DEPOSIT_BOT_TOKEN.value();
      const update = request.body;

      // التحقق من نوع الرسالة
      if (update.callback_query) {
        await handleCallbackQuery(update.callback_query, botToken);
      } else if (update.message) {
        logger.info(`📨 رسالة عادية من ${update.message.chat.id}: ${update.message.text}`);
      }

      response.status(200).send('OK');
    } catch (error) {
      logger.error('❌ خطأ في Webhook:', error);
      response.status(200).send('OK'); // دائماً 200 للتيليجرام
    }
  }
);

async function handleCallbackQuery(callbackQuery, botToken) {
  const data = callbackQuery.data;
  const message = callbackQuery.message;
  const chatId = message.chat.id;
  const messageId = message.message_id;

  if (data.startsWith('approve_deposit_')) {
    const depositId = data.replace('approve_deposit_', '');

    try {
      // ✅ استخدام Transaction لضمان الذرية
      const result = await admin.firestore().runTransaction(async (tx) => {
        const depositRef = admin.firestore().collection('topUpRequests').doc(depositId);
        const depositSnap = await tx.get(depositRef);

        if (!depositSnap.exists) {
          return { success: false, error: 'الطلب غير موجود' };
        }

        const depositData = depositSnap.data();
        if (depositData.status === 'approved') {
          return { success: false, error: 'الطلب معتمد مسبقاً' };
        }

        // تحديث حالة الطلب
        tx.update(depositRef, {
          status: 'approved',
          approvedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // إضافة الرصيد للمستخدم
        const userRef = admin.firestore().collection('users').doc(depositData.userId);
        tx.update(userRef, {
          balance: admin.firestore.FieldValue.increment(depositData.amount || 0),
        });

        return { success: true, amount: depositData.amount };
      });

      if (result.success) {
        await sendTelegramMessage(chatId, messageId, botToken, `✅ تم تأكيد الإيداع ${depositId} بنجاح (${result.amount} USD)`);
      } else {
        await sendTelegramMessage(chatId, messageId, botToken, `⚠️ ${result.error}`);
      }

    } catch (error) {
      logger.error('❌ فشل تأكيد الإيداع:', error);
      await sendTelegramMessage(chatId, messageId, botToken, '❌ فشل تأكيد الإيداع');
    }
  }

  else if (data.startsWith('reject_deposit_')) {
    const depositId = data.replace('reject_deposit_', '');

    try {
      const depositRef = admin.firestore().collection('topUpRequests').doc(depositId);
      const depositSnap = await depositRef.get();

      if (!depositSnap.exists) {
        await sendTelegramMessage(chatId, messageId, botToken, '⚠️ الطلب غير موجود');
        return;
      }

      if (depositSnap.data().status === 'rejected') {
        await sendTelegramMessage(chatId, messageId, botToken, '⚠️ الطلب مرفوض مسبقاً');
        return;
      }

      await depositRef.update({
        status: 'rejected',
        rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await sendTelegramMessage(chatId, messageId, botToken, `❌ تم رفض الإيداع ${depositId}`);

    } catch (error) {
      logger.error('❌ فشل رفض الإيداع:', error);
      await sendTelegramMessage(chatId, messageId, botToken, '❌ فشل رفض الإيداع');
    }
  }
}

async function sendTelegramMessage(chatId, messageId, botToken, text) {
  const axios = require('axios');
  await axios.post(`https://api.telegram.org/bot${botToken}/editMessageText`, {
    chat_id: chatId,
    message_id: messageId,
    text: text,
  });
}