const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const { logger } = require('firebase-functions/v2');

// ===== ثوابت أمنية =====
const MAX_SINGLE_TRANSACTION = 10000;  // الحد الأقصى للعملية الواحدة
const MAX_BALANCE = 1000000;           // الحد الأقصى للرصيد

// ===== دالة مساعدة: جلب سعر MGC من Firestore =====
async function getMgcRate() {
  try {
    const snap = await admin.firestore().collection('settings').doc('exchange').get();
    const rate = snap.exists ? snap.data().mgcRate : null;
    if (rate && rate > 0) return rate;
  } catch (e) {
    logger.warn('⚠️ فشل جلب سعر MGC:', e.message);
  }
  return 0.007; // fallback
}

// ===== دالة مساعدة: تسجيل عملية في سجل التدقيق المالي =====
async function logAudit(userId, type, amount, previousBalance, newBalance, reason) {
  try {
    await admin.firestore().collection('balanceAudit').add({
      userId,
      type,
      amount,
      previousBalance,
      newBalance,
      reason,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (e) {
    logger.warn('⚠️ فشل تسجيل التدقيق المالي:', e.message);
  }
}

// ===== دالة مساعدة: تسجيل في سجل التدقيق العام =====
async function logAuditGeneral(action, userId, details) {
  try {
    await admin.firestore().collection('auditLogs').add({
      action,
      userId,
      ...details,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (e) {
    logger.warn('⚠️ فشل تسجيل التدقيق العام:', e.message);
  }
}

// ===== دالة مساعدة: التحقق من المستخدم وحالة الحظر =====
async function validateUser(uid) {
  const userRef = admin.firestore().collection('users').doc(uid);
  const snap = await userRef.get();
  if (!snap.exists) throw new HttpsError('not-found', 'المستخدم غير موجود');
  const data = snap.data();
  // ✅ التحقق من عدم حظر المستخدم
  if (data.disabled === true) {
    throw new HttpsError('permission-denied', 'الحساب محظور، لا يمكنك إجراء عمليات مالية');
  }
  return { userRef, data };
}

// ============================================================
// 1. إضافة/خصم رصيد (آمن مع حدود وسجل تدقيق)
// ============================================================
exports.updateBalance = onCall({ cors: true }, async (request) => {
  try {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'يجب تسجيل الدخول');
    }

    const uid = request.auth.uid;
    const { amount, type, reason } = request.data;

    // ===== التحقق من المدخلات =====
    if (typeof amount !== 'number' || !isFinite(amount) || amount === 0) {
      throw new HttpsError('invalid-argument', 'قيمة غير صالحة');
    }
    if (!type || (type !== 'real' && type !== 'mgc')) {
      throw new HttpsError('invalid-argument', 'نوع الرصيد يجب أن يكون real أو mgc');
    }
    if (!reason || typeof reason !== 'string' || reason.trim().length < 3) {
      throw new HttpsError('invalid-argument', 'سبب العملية مطلوب (3 أحرف على الأقل)');
    }

    // ✅ تنظيف السبب من الأحرف الضارة (اختياري)
    const cleanReason = reason.trim().replace(/[<>]/g, '');

    // الحدود الأمنية
    if (Math.abs(amount) > MAX_SINGLE_TRANSACTION) {
      throw new HttpsError('invalid-argument', `الحد الأقصى للعملية هو ${MAX_SINGLE_TRANSACTION}`);
    }

    // ===== التحقق من المستخدم والحظر =====
    const { userRef, data } = await validateUser(uid);
    const fieldName = type === 'real' ? 'balance' : 'mgcBalance';

    // ===== تنفيذ المعاملة =====
    const result = await admin.firestore().runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      if (!snap.exists) throw new Error('المستخدم غير موجود');

      const current = snap.data()[fieldName] || 0;
      const next = current + amount;

      if (next < 0) {
        throw new HttpsError('failed-precondition', type === 'real' ? 'الرصيد غير كافٍ' : 'رصيد MGC غير كافٍ');
      }
      if (next > MAX_BALANCE) {
        throw new HttpsError('failed-precondition', 'الرصيد تجاوز الحد المسموح');
      }

      tx.update(userRef, { [fieldName]: next });
      return { previous: current, next };
    });

    // ===== تسجيل التدقيق =====
    await logAudit(
      uid,
      type === 'real' ? 'balance_update' : 'mgc_update',
      amount,
      result.previous,
      result.next,
      cleanReason
    );
    await logAuditGeneral('updateBalance', uid, {
      type,
      amount,
      previousBalance: result.previous,
      newBalance: result.next,
      reason: cleanReason,
    });

    logger.info(`✅ updateBalance: user=${uid}, type=${type}, amount=${amount}, new=${result.next}`);
    return { success: true, previousBalance: result.previous, newBalance: result.next };
  } catch (error) {
    logger.error('❌ updateBalance:', error);
    throw error instanceof HttpsError ? error : new HttpsError('internal', error.message);
  }
});

// ============================================================
// 2. شراء MGC (USD → MGC)
// ============================================================
exports.buyMgc = onCall({ cors: true }, async (request) => {
  try {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'يجب تسجيل الدخول');
    }

    const uid = request.auth.uid;
    const { mgcAmount, priceUSD } = request.data;

    // ===== التحقق من المدخلات =====
    if (!mgcAmount || typeof mgcAmount !== 'number' || mgcAmount <= 0 || mgcAmount > MAX_SINGLE_TRANSACTION) {
      throw new HttpsError('invalid-argument', 'كمية MGC غير صالحة');
    }
    if (!priceUSD || typeof priceUSD !== 'number' || priceUSD <= 0 || priceUSD > MAX_SINGLE_TRANSACTION) {
      throw new HttpsError('invalid-argument', 'السعر غير صالح');
    }

    // ===== التحقق من المستخدم والحظر =====
    const { userRef, data } = await validateUser(uid);

    // ===== تنفيذ المعاملة =====
    const result = await admin.firestore().runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      const userData = snap.data();
      if ((userData.balance || 0) < priceUSD) {
        throw new HttpsError('failed-precondition', 'الرصيد الحقيقي غير كافٍ');
      }
      if ((userData.mgcBalance || 0) + mgcAmount > MAX_BALANCE) {
        throw new HttpsError('failed-precondition', 'رصيد MGC تجاوز الحد المسموح');
      }

      tx.update(userRef, {
        balance: admin.firestore.FieldValue.increment(-priceUSD),
        mgcBalance: admin.firestore.FieldValue.increment(mgcAmount),
      });
      return {
        previousBalance: userData.balance || 0,
        previousMgc: userData.mgcBalance || 0,
      };
    });

    // ===== تسجيل العملية =====
    await admin.firestore().collection('transactions').add({
      userId: uid,
      type: 'buy_mgc',
      mgcAmount,
      priceUSD,
      status: 'completed',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await logAudit(
      uid,
      'buy_mgc',
      -priceUSD,
      result.previousBalance,
      result.previousBalance - priceUSD,
      `شراء ${mgcAmount} MGC`
    );
    await logAuditGeneral('buyMgc', uid, {
      mgcAmount,
      priceUSD,
      newBalance: result.previousBalance - priceUSD,
      newMgcBalance: result.previousMgc + mgcAmount,
    });

    logger.info(`✅ buyMgc: user=${uid}, mgc=${mgcAmount}, price=${priceUSD}`);
    return { success: true };
  } catch (error) {
    logger.error('❌ buyMgc:', error);
    throw error instanceof HttpsError ? error : new HttpsError('internal', error.message);
  }
});

// ============================================================
// 3. بيع MGC (MGC → USD) - سعر ديناميكي
// ============================================================
exports.sellMgc = onCall({ cors: true }, async (request) => {
  try {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'يجب تسجيل الدخول');
    }

    const uid = request.auth.uid;
    const { mgcAmount } = request.data;

    // ===== التحقق من المدخلات =====
    if (!mgcAmount || typeof mgcAmount !== 'number' || mgcAmount <= 0 || mgcAmount > MAX_SINGLE_TRANSACTION) {
      throw new HttpsError('invalid-argument', 'الكمية غير صالحة');
    }

    // ===== جلب سعر الصرف =====
    const rate = await getMgcRate();
    const usdAmount = mgcAmount * rate;

    // ===== التحقق من المستخدم والحظر =====
    const { userRef, data } = await validateUser(uid);

    // ===== تنفيذ المعاملة =====
    const result = await admin.firestore().runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      const userData = snap.data();
      if ((userData.mgcBalance || 0) < mgcAmount) {
        throw new HttpsError('failed-precondition', 'رصيد MGC غير كافٍ');
      }
      if ((userData.balance || 0) + usdAmount > MAX_BALANCE) {
        throw new HttpsError('failed-precondition', 'الرصيد الحقيقي تجاوز الحد المسموح');
      }

      tx.update(userRef, {
        mgcBalance: admin.firestore.FieldValue.increment(-mgcAmount),
        balance: admin.firestore.FieldValue.increment(usdAmount),
      });
      return {
        previousMgc: userData.mgcBalance || 0,
        previousBalance: userData.balance || 0,
      };
    });

    // ===== تسجيل العملية =====
    await admin.firestore().collection('transactions').add({
      userId: uid,
      type: 'sell_mgc',
      mgcAmount,
      usdAmount,
      rate,
      status: 'completed',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await logAudit(
      uid,
      'sell_mgc',
      mgcAmount,
      result.previousMgc,
      result.previousMgc - mgcAmount,
      `بيع ${mgcAmount} MGC بسعر ${rate}`
    );
    await logAuditGeneral('sellMgc', uid, {
      mgcAmount,
      usdAmount,
      rate,
      newMgcBalance: result.previousMgc - mgcAmount,
      newBalance: result.previousBalance + usdAmount,
    });

    logger.info(`✅ sellMgc: user=${uid}, mgc=${mgcAmount}, usd=${usdAmount.toFixed(4)}`);
    return {
      success: true,
      rate,
      usdAmount: Math.round(usdAmount * 10000) / 10000,
    };
  } catch (error) {
    logger.error('❌ sellMgc:', error);
    throw error instanceof HttpsError ? error : new HttpsError('internal', error.message);
  }
});

// ============================================================
// 4. إنشاء طلب آمن (مع خصم رصيد)
// ============================================================
exports.createSecureOrder = onCall({ cors: true }, async (request) => {
  try {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'يجب تسجيل الدخول');
    }

    const uid = request.auth.uid;
    const { finalPriceUSD, productId, productName, category } = request.data;

    // ===== التحقق من المدخلات =====
    if (!finalPriceUSD || typeof finalPriceUSD !== 'number' || finalPriceUSD <= 0 || finalPriceUSD > MAX_SINGLE_TRANSACTION) {
      throw new HttpsError('invalid-argument', 'سعر غير صالح');
    }
    if (!productId || typeof productId !== 'string' || productId.trim().length === 0) {
      throw new HttpsError('invalid-argument', 'معرف المنتج مطلوب');
    }

    // ===== التحقق من المستخدم والحظر =====
    const { userRef, data } = await validateUser(uid);
    let orderId;

    // ===== تنفيذ المعاملة =====
    await admin.firestore().runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      const userData = snap.data();
      if ((userData.balance || 0) < finalPriceUSD) {
        throw new HttpsError('failed-precondition', 'الرصيد غير كافٍ');
      }

      tx.update(userRef, {
        balance: admin.firestore.FieldValue.increment(-finalPriceUSD),
      });

      const orderRef = admin.firestore().collection('orders').doc();
      orderId = orderRef.id;

      tx.set(orderRef, {
        userId: uid,
        userName: userData.name || 'مستخدم',
        productId: productId.trim(),
        productName: productName || 'منتج',
        category: category || 'عام',
        price: finalPriceUSD,
        status: 'pending_verification',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    // ===== تسجيل التدقيق =====
    await logAudit(
      uid,
      'order_create',
      -finalPriceUSD,
      data.balance || 0,
      (data.balance || 0) - finalPriceUSD,
      `طلب: ${productName || 'منتج'} (ID: ${productId})`
    );
    await logAuditGeneral('createSecureOrder', uid, {
      orderId,
      productId,
      productName,
      finalPriceUSD,
      newBalance: (data.balance || 0) - finalPriceUSD,
    });

    logger.info(`✅ createSecureOrder: user=${uid}, order=${orderId}, price=${finalPriceUSD}`);
    return { success: true, orderId };
  } catch (error) {
    logger.error('❌ createSecureOrder:', error);
    throw error instanceof HttpsError ? error : new HttpsError('internal', error.message);
  }
});


// تصدير الدوال المساعدة للاختبارات
exports.validateUser = validateUser;
exports.logAudit = logAudit;
exports.getMgcRate = getMgcRate;