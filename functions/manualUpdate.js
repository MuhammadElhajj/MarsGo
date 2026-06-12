const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

exports.manualUpdateExchangeRate = functions.https.onCall(async (data, context) => {
  // ✅ فقط التحقق من وجود مستخدم مسجل الدخول (بدون التحقق من role)
  // if (!context.auth) {
  //   throw new functions.https.HttpsError('unauthenticated', 'يجب تسجيل الدخول');
  // }
  
  // تم إزالة التحقق من role تماماً

  try {
    const response = await axios.get('https://lirascope.syria-cloud.sy/api/v1/rates/latest', { timeout: 10000 });
    const usdRate = response.data.effectiveRates?.find(r => r.currency === 'USD');
    if (!usdRate || !usdRate.mid) {
      throw new Error('USD rate not found');
    }
    await admin.firestore().doc('exchangeRate/default').set({
      value: usdRate.mid,
      buy: usdRate.buy,
      sell: usdRate.sell,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      source: 'LiraScope (manual)'
    }, { merge: true });
    return { success: true, rate: usdRate.mid };
  } catch (error) {
    console.error('Manual update error:', error.message);
    throw new functions.https.HttpsError('internal', 'فشل تحديث سعر الصرف: ' + error.message);
  }
});