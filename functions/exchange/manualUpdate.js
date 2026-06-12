const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

exports.manualUpdateExchangeRate = functions.https.onCall(async (data, context) => {
  // التحقق من المصادقة
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'يجب تسجيل الدخول');
  }
  const uid = context.auth.uid;
  const userDoc = await admin.firestore().collection('users').doc(uid).get();
  if (userDoc.data()?.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'صلاحيات المدير مطلوبة');
  }

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