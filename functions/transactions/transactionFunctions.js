const { onCall } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

// ===== دالة مساعدة: جلب سعر MGC من Firestore =====
async function getMgcRate() {
  try {
    const snap = await admin.firestore().collection('settings').doc('exchange').get();
    const rate = snap.exists ? snap.data().mgcRate : null;
    if (rate && rate > 0) return rate;
  } catch (e) {
    console.warn('⚠️ فشل جلب سعر MGC:', e.message);
  }
  return 0.007; // fallback
}

// ===== 1. إضافة/خصم رصيد (atomic transaction) =====
exports.updateBalance = onCall({ cors: true }, async (request) => {
  try {
    if (!request.auth) throw new Error('يجب تسجيل الدخول');

    const uid = request.auth.uid;
    const { amount, type } = request.data;

    if (typeof amount !== 'number' || amount === 0) throw new Error('قيمة غير صالحة');
    if (!type || (type !== 'real' && type !== 'mgc')) throw new Error('نوع الرصيد يجب أن يكون real أو mgc');

    const userRef = admin.firestore().collection('users').doc(uid);
    const fieldName = type === 'real' ? 'balance' : 'mgcBalance';

    await admin.firestore().runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      if (!snap.exists) throw new Error('المستخدم غير موجود');

      const current = snap.data()[fieldName] || 0;
      const next = current + amount;

      if (next < 0) throw new Error(type === 'real' ? 'الرصيد غير كافٍ' : 'رصيد MGC غير كافٍ');

      tx.update(userRef, { [fieldName]: next });
    });

    return { success: true };
  } catch (error) {
    console.error('❌ updateBalance:', error);
    throw new Error(error.message);
  }
});

// ===== 2. شراء MGC (USD → MGC) =====
exports.buyMgc = onCall({ cors: true }, async (request) => {
  try {
    if (!request.auth) throw new Error('يجب تسجيل الدخول');

    const uid = request.auth.uid;
    const { mgcAmount, priceUSD } = request.data;
    if (!mgcAmount || mgcAmount <= 0 || !priceUSD || priceUSD <= 0) throw new Error('بيانات غير صالحة');

    const userRef = admin.firestore().collection('users').doc(uid);

    await admin.firestore().runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      if (!snap.exists) throw new Error('المستخدم غير موجود');

      const data = snap.data();
      if ((data.balance || 0) < priceUSD) throw new Error('الرصيد غير كافٍ');

      tx.update(userRef, {
        balance: admin.firestore.FieldValue.increment(-priceUSD),
        mgcBalance: admin.firestore.FieldValue.increment(mgcAmount),
      });
    });

    await admin.firestore().collection('transactions').add({
      userId: uid, type: 'buy_mgc', mgcAmount, priceUSD, status: 'completed',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error('❌ buyMgc:', error);
    throw new Error(error.message);
  }
});

// ===== 3. بيع MGC (MGC → USD) - سعر ديناميكي =====
exports.sellMgc = onCall({ cors: true }, async (request) => {
  try {
    if (!request.auth) throw new Error('يجب تسجيل الدخول');

    const uid = request.auth.uid;
    const { mgcAmount } = request.data;
    if (!mgcAmount || mgcAmount <= 0) throw new Error('الكمية غير صالحة');

    const rate = await getMgcRate();
    const usdAmount = mgcAmount * rate;
    const userRef = admin.firestore().collection('users').doc(uid);

    await admin.firestore().runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      if (!snap.exists) throw new Error('المستخدم غير موجود');

      const data = snap.data();
      if ((data.mgcBalance || 0) < mgcAmount) throw new Error('رصيد MGC غير كافٍ');

      tx.update(userRef, {
        mgcBalance: admin.firestore.FieldValue.increment(-mgcAmount),
        balance: admin.firestore.FieldValue.increment(usdAmount),
      });
    });

    await admin.firestore().collection('transactions').add({
      userId: uid, type: 'sell_mgc', mgcAmount, usdAmount, rate, status: 'completed',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, rate, usdAmount };
  } catch (error) {
    console.error('❌ sellMgc:', error);
    throw new Error(error.message);
  }
});

// ===== 4. إنشاء طلب آمن (مع خصم رصيد) =====
exports.createSecureOrder = onCall({ cors: true }, async (request) => {
  try {
    if (!request.auth) throw new Error('يجب تسجيل الدخول');

    const uid = request.auth.uid;
    const { finalPriceUSD, productId, productName, category } = request.data;
    if (!finalPriceUSD || finalPriceUSD <= 0) throw new Error('سعر غير صالح');

    const userRef = admin.firestore().collection('users').doc(uid);
    let orderId;

    await admin.firestore().runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      if (!snap.exists) throw new Error('المستخدم غير موجود');

      const data = snap.data();
      if ((data.balance || 0) < finalPriceUSD) throw new Error('الرصيد غير كافٍ');

      tx.update(userRef, { balance: admin.firestore.FieldValue.increment(-finalPriceUSD) });

      const orderRef = admin.firestore().collection('orders').doc();
      orderId = orderRef.id;

      tx.set(orderRef, {
        userId: uid, userName: data.name || 'مستخدم',
        productId: productId || null, productName: productName || 'منتج',
        category: category || 'عام', price: finalPriceUSD, status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    return { success: true, orderId };
  } catch (error) {
    console.error('❌ createSecureOrder:', error);
    throw new Error(error.message);
  }
});