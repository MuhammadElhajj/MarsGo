// functions/telegramBot/telegramBot.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

const db = admin.firestore();

// ✅ قراءة التوكن من متغيرات البيئة (process.env) بدلاً من functions.config()
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN environment variable is missing');
}

exports.telegramWebhook = functions.https.onRequest(async (req, res) => {
  // التحقق من صحة التوكن
  if (!BOT_TOKEN) {
    console.error('Missing TELEGRAM_BOT_TOKEN');
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
        text,
        parse_mode: 'Markdown'
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