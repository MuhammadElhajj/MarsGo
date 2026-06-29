// functions/autoUpdate.js
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { logger } = require('firebase-functions/v2');
const admin = require('firebase-admin');
const axios = require('axios');

/**
 * تحديث تلقائي لسعر الصرف كل ساعة
 */
exports.updateExchangeRate = onSchedule(
  { schedule: 'every 60 minutes', timeZone: 'Asia/Damascus' },
  async (event) => {
    try {
      const response = await axios.get(
        'https://lirascope.syria-cloud.sy/api/v1/rates/latest',
        { timeout: 10000 }
      );

      const usdRate = response.data.effectiveRates?.find(r => r.currency === 'USD');
      if (!usdRate || !usdRate.mid) {
        throw new Error('USD rate not found');
      }

      await admin.firestore().doc('exchangeRate/default').set({
        value: usdRate.mid,
        buy: usdRate.buy,
        sell: usdRate.sell,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        source: 'LiraScope (auto)',
      }, { merge: true });

      logger.info(`✅ سعر الصرف التلقائي: ${usdRate.mid} SYP`);
      return { success: true, rate: usdRate.mid };

    } catch (error) {
      logger.error('❌ فشل التحديث التلقائي:', error.message);
      throw error;
    }
  }
);