const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');
const axios = require('axios');

exports.updateExchangeRate = onSchedule(
  {
    schedule: '*/15 * * * *',   // كل 15 دقيقة
    timeZone: 'Asia/Damascus',
  },
  async (event) => {
    try {
      const response = await axios.get('https://lirascope.syria-cloud.sy/api/v1/rates/latest', { timeout: 10000 });
      const usdRate = response.data.effectiveRates?.find(r => r.currency === 'USD');
      if (!usdRate) throw new Error('USD rate not found');
      await admin.firestore().doc('exchangeRate/default').set({
        value: usdRate.mid,
        buy: usdRate.buy,
        sell: usdRate.sell,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        source: 'LiraScope (auto)'
      }, { merge: true });
      console.log(`✅ Auto rate updated: ${usdRate.mid} SYP`);
    } catch (error) {
      console.error('❌ Auto update failed:', error.message);
    }
  }
);