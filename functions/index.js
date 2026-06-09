// const functions = require('firebase-functions');
// const admin = require('firebase-admin');
// const axios = require('axios');

// admin.initializeApp();
// const db = admin.firestore();

// const BOT_TOKEN = "8916881340:AAEh655YlM__-E9D5YHRDtPt7KCo_v9y2gw";

// exports.telegramWebhook = functions.https.onRequest(async (req, res) => {
//   if (req.method !== 'POST') {
//     return res.status(405).send('Method Not Allowed');
//   }

//   const update = req.body;
//   console.log("📨 Received update:", JSON.stringify(update));

//   // معالجة الضغط على الأزرار (callback_query)
//   if (update.callback_query) {
//     const callback = update.callback_query;
//     const chatId = callback.message.chat.id;
//     const data = callback.data;
//     console.log("🔘 Callback data received:", data);

//     // تقسيم البيانات بحيث نأخذ أول جزئين (action, type) والباقي كله requestId
//     const parts = data.split('_');
//     const action = parts[0];
//     const type = parts[1];
//     const requestId = parts.slice(2).join('_'); // لاحتواء الـ ID على شرطات سفلية
//     console.log(`📦 Extracted: action=${action}, type=${type}, requestId=${requestId}`);

//     if (type === 'deposit' && requestId) {
//       const depositRef = db.collection('topUpRequests').doc(requestId);
//       const depositSnap = await depositRef.get();
//       console.log("🔍 Deposit document exists?", depositSnap.exists);

//       if (!depositSnap.exists) {
//         await answerCallback(callback.id, '⚠️ طلب الإيداع غير موجود');
//         return res.sendStatus(200);
//       }

//       const deposit = depositSnap.data();
//       console.log("💰 Deposit status:", deposit.status);

//       if (deposit.status !== 'pending') {
//         await answerCallback(callback.id, `⚠️ تم معالجة هذا الطلب مسبقاً (الحالة: ${deposit.status})`);
//         return res.sendStatus(200);
//       }

//       if (action === 'approve') {
//         const userRef = db.collection('users').doc(deposit.userId);
//         await db.runTransaction(async (transaction) => {
//           const userSnap = await transaction.get(userRef);
//           const currentBalance = userSnap.data()?.balance || 0;
//           const newBalance = currentBalance + deposit.amount;
//           transaction.update(userRef, { balance: newBalance });
//           transaction.update(depositRef, { 
//             status: 'approved', 
//             approvedAt: admin.firestore.FieldValue.serverTimestamp() 
//           });
//           console.log(`✅ Added ${deposit.amount} to user ${deposit.userId}, new balance: ${newBalance}`);
//         });
//         await answerCallback(callback.id, `✅ تمت الموافقة على إيداع ${deposit.amount} $`);
//         await notifyUser(deposit.userId, `تم إضافة ${deposit.amount} $ إلى رصيدك بنجاح.`);
//       } 
//       else if (action === 'reject') {
//         await depositRef.update({ 
//           status: 'rejected', 
//           rejectedAt: admin.firestore.FieldValue.serverTimestamp() 
//         });
//         console.log(`❌ Deposit ${requestId} rejected`);
//         await answerCallback(callback.id, `❌ تم رفض إيداع ${deposit.amount} $`);
//         await notifyUser(deposit.userId, `عذراً، تم رفض طلب إيداعك بقيمة ${deposit.amount} $.`);
//       }

//       // إزالة الأزرار من الرسالة الأصلية
//       await editMessageReplyMarkup(chatId, callback.message.message_id);
//     }
//     res.sendStatus(200);
//   } 
//   // معالجة الأوامر النصية (مثل /start)
//   else if (update.message && update.message.text === '/start') {
//     const chatId = update.message.chat.id;
//     const username = update.message.from.username;
//     console.log(`📱 /start from @${username} (chatId: ${chatId})`);
//     await saveTelegramChatIdMapping(chatId, username);
//     await sendTelegramMessage(chatId, 'مرحباً! سيتم إعلامك عند الموافقة على طلبات الإيداع.');
//     res.sendStatus(200);
//   } 
//   else {
//     console.log("ℹ️ Unhandled update type");
//     res.sendStatus(200);
//   }
// });

// // دوال مساعدة مع تحسين معالجة الأخطاء
// async function answerCallback(callbackId, text) {
//   const url = `https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`;
//   try {
//     await axios.post(url, { callback_query_id: callbackId, text, show_alert: false });
//   } catch (err) {
//     console.error("❌ Failed to answer callback:", err.message);
//   }
// }

// async function editMessageReplyMarkup(chatId, messageId) {
//   const url = `https://api.telegram.org/bot${BOT_TOKEN}/editMessageReplyMarkup`;
//   try {
//     await axios.post(url, { chat_id: chatId, message_id: messageId, reply_markup: {} });
//   } catch (err) {
//     console.error("❌ Failed to edit message reply markup:", err.message);
//   }
// }

// async function sendTelegramMessage(chatId, text) {
//   const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
//   try {
//     await axios.post(url, { chat_id: chatId, text });
//   } catch (err) {
//     console.error(`❌ Failed to send message to chat ${chatId}:`, err.message);
//   }
// }

// async function notifyUser(userId, message) {
//   try {
//     const userDoc = await db.collection('users').doc(userId).get();
//     const telegramChatId = userDoc.data()?.telegramChatId;
//     if (telegramChatId) {
//       await sendTelegramMessage(telegramChatId, message);
//     } else {
//       console.log(`ℹ️ User ${userId} has no telegramChatId`);
//     }
//   } catch (err) {
//     console.error(`❌ Error notifying user ${userId}:`, err.message);
//   }
// }

// async function saveTelegramChatIdMapping(chatId, username) {
//   if (!username) {
//     console.log("⚠️ No username provided for /start");
//     return;
//   }
//   try {
//     const snapshot = await db.collection('users').where('telegramUsername', '==', username).get();
//     if (!snapshot.empty) {
//       const userId = snapshot.docs[0].id;
//       await db.collection('users').doc(userId).update({ telegramChatId: chatId });
//       console.log(`✅ Linked chatId ${chatId} to user ${userId} (username: ${username})`);
//     } else {
//       console.log(`⚠️ No user found with telegramUsername = ${username}`);
//     }
//   } catch (err) {
//     console.error("❌ Error saving telegram chatId mapping:", err.message);
//   }
// }

// functions/index.js
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

admin.initializeApp();
const db = admin.firestore();

/**
 * دالة webhook لبوت تيليجرام – تعتمد على secret آمن
 */
exports.telegramWebhook = functions
  .runWith({ secrets: ['TELEGRAM_BOT_TOKEN'] })
  .https.onRequest(async (req, res) => {
    // قراءة التوكن من السر
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    if (!BOT_TOKEN) {
      console.error('❌ Secret TELEGRAM_BOT_TOKEN is missing. Set it with: firebase functions:secrets:set TELEGRAM_BOT_TOKEN');
      return res.status(500).send('Server configuration error: missing token');
    }

    const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

    // ========== دوال مساعدة ==========
    async function answerCallback(callbackId, text) {
      try {
        await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, {
          callback_query_id: callbackId,
          text,
          show_alert: false
        });
      } catch (err) {
        console.error('❌ answerCallback error:', err.message);
      }
    }

    async function editMessageReplyMarkup(chatId, messageId) {
      try {
        await axios.post(`${TELEGRAM_API}/editMessageReplyMarkup`, {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: {}
        });
      } catch (err) {
        console.error('❌ editMessageReplyMarkup error:', err.message);
      }
    }

    async function sendTelegramMessage(chatId, text) {
      try {
        await axios.post(`${TELEGRAM_API}/sendMessage`, {
          chat_id: chatId,
          text
        });
      } catch (err) {
        console.error(`❌ sendMessage to ${chatId} failed:`, err.message);
      }
    }

    async function notifyUser(userId, message) {
      try {
        const userDoc = await db.collection('users').doc(userId).get();
        const telegramChatId = userDoc.data()?.telegramChatId;
        if (telegramChatId) {
          await sendTelegramMessage(telegramChatId, message);
        } else {
          console.log(`ℹ️ User ${userId} has no linked Telegram chat`);
        }
      } catch (err) {
        console.error(`❌ notifyUser error:`, err.message);
      }
    }

    async function saveTelegramChatIdMapping(chatId, username) {
      if (!username) {
        console.log('⚠️ No username provided, skipping mapping');
        return;
      }
      try {
        const snapshot = await db.collection('users').where('telegramUsername', '==', username).get();
        if (!snapshot.empty) {
          const userId = snapshot.docs[0].id;
          await db.collection('users').doc(userId).update({ telegramChatId: chatId });
          console.log(`✅ Linked chatId ${chatId} to user ${userId} (username: ${username})`);
        } else {
          console.log(`⚠️ No user found with telegramUsername = ${username}`);
        }
      } catch (err) {
        console.error('❌ saveTelegramChatIdMapping error:', err.message);
      }
    }

    // ========== معالجة الطلب ==========
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }

    const update = req.body;
    console.log('📨 Received update:', JSON.stringify(update));

    // معالجة الضغط على الأزرار (callback_query)
    if (update.callback_query) {
      const callback = update.callback_query;
      const chatId = callback.message.chat.id;
      const data = callback.data;
      console.log('🔘 Callback data:', data);

      // تنسيق البيانات: approve_deposit_<requestId> أو reject_deposit_<requestId>
      const parts = data.split('_');
      const action = parts[0];
      const type = parts[1];
      const requestId = parts.slice(2).join('_');

      if (type === 'deposit' && requestId) {
        const depositRef = db.collection('topUpRequests').doc(requestId);
        const depositSnap = await depositRef.get();

        if (!depositSnap.exists) {
          await answerCallback(callback.id, '⚠️ طلب الإيداع غير موجود');
          return res.sendStatus(200);
        }

        const deposit = depositSnap.data();
        console.log(`💰 Deposit ${requestId} status: ${deposit.status}`);

        if (deposit.status !== 'pending') {
          await answerCallback(callback.id, `⚠️ تمت معالجة هذا الطلب مسبقاً (الحالة: ${deposit.status})`);
          return res.sendStatus(200);
        }

        // تنفيذ الموافقة أو الرفض
        if (action === 'approve') {
          const userRef = db.collection('users').doc(deposit.userId);
          try {
            await db.runTransaction(async (transaction) => {
              const userSnap = await transaction.get(userRef);
              const currentBalance = userSnap.data()?.balance || 0;
              const newBalance = currentBalance + deposit.amount;
              transaction.update(userRef, { balance: newBalance });
              transaction.update(depositRef, {
                status: 'approved',
                approvedAt: admin.firestore.FieldValue.serverTimestamp()
              });
              console.log(`✅ Added ${deposit.amount} to user ${deposit.userId}, new balance: ${newBalance}`);
            });
            await answerCallback(callback.id, `✅ تمت الموافقة على إيداع ${deposit.amount} $`);
            await notifyUser(deposit.userId, `تم إضافة ${deposit.amount} $ إلى رصيدك بنجاح.`);
          } catch (err) {
            console.error('❌ Transaction failed:', err);
            await answerCallback(callback.id, '❌ حدث خطأ أثناء الموافقة على الإيداع');
            return res.sendStatus(200);
          }
        } 
        else if (action === 'reject') {
          await depositRef.update({
            status: 'rejected',
            rejectedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          console.log(`❌ Deposit ${requestId} rejected`);
          await answerCallback(callback.id, `❌ تم رفض إيداع ${deposit.amount} $`);
          await notifyUser(deposit.userId, `عذراً، تم رفض طلب إيداعك بقيمة ${deposit.amount} $.`);
        }

        // إزالة الأزرار من الرسالة الأصلية
        await editMessageReplyMarkup(chatId, callback.message.message_id);
      }
      res.sendStatus(200);
    }
    // معالجة الأمر /start
    else if (update.message && update.message.text === '/start') {
      const chatId = update.message.chat.id;
      const username = update.message.from.username;
      console.log(`📱 /start from @${username} (chatId: ${chatId})`);
      await saveTelegramChatIdMapping(chatId, username);
      await sendTelegramMessage(chatId, 'مرحباً! سيتم إعلامك عند الموافقة على طلبات الإيداع.');
      res.sendStatus(200);
    }
    else {
      console.log('ℹ️ Unhandled update type');
      res.sendStatus(200);
    }
  });