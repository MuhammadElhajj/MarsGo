const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

module.exports = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Missing or invalid token' });
    return;
  }

  const idToken = authHeader.split('Bearer ')[1];
  let decodedToken;
  try {
    decodedToken = await admin.auth().verifyIdToken(idToken);
  } catch (err) {
    res.status(401).json({ success: false, error: 'Invalid token' });
    return;
  }

  const userDoc = await admin.firestore().collection('users').doc(decodedToken.uid).get();
  if (userDoc.data()?.role !== 'admin') {
    res.status(403).json({ success: false, error: 'Admin role required' });
    return;
  }

  try {
    const response = await axios.get('https://lirascope.syria-cloud.sy/api/v1/rates/latest');
    const usdRate = response.data.effectiveRates?.find(r => r.currency === 'USD');
    if (!usdRate) throw new Error('USD rate not found');

    await admin.firestore().doc('exchangeRate/default').set({
      value: usdRate.mid,
      buy: usdRate.buy,
      sell: usdRate.sell,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      source: 'LiraScope (manual)'
    });

    res.status(200).json({ success: true, rate: usdRate.mid });
  } catch (error) {
    console.error('Manual update error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});