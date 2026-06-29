// functions/referral/supportUser.js
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const { logger } = require('firebase-functions/v2');

/**
 * دعم مستخدم آخر (زيادة الشعبية و XP)
 * - يخصم 20 MGC من الداعم
 * - يزيد popularity بمقدار 1 و xp بمقدار 5 للمستهدف
 */
exports.supportUser = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'يجب تسجيل الدخول');
  }

  const uid = request.auth.uid;
  const { targetUserId } = request.data;

  if (!targetUserId) {
    throw new HttpsError('invalid-argument', 'معرف المستخدم المستهدف مطلوب');
  }
  if (uid === targetUserId) {
    throw new HttpsError('invalid-argument', 'لا يمكنك دعم نفسك');
  }

  const SUPPORT_COST = 20;
  const db = admin.firestore();

  try {
    await db.runTransaction(async (tx) => {
      const userRef = db.collection('users').doc(uid);
      const targetRef = db.collection('users').doc(targetUserId);

      const [userSnap, targetSnap] = await Promise.all([
        tx.get(userRef),
        tx.get(targetRef),
      ]);

      if (!userSnap.exists) throw new HttpsError('not-found', 'المستخدم غير موجود');
      if (!targetSnap.exists) throw new HttpsError('not-found', 'المستخدم المستهدف غير موجود');

      const userData = userSnap.data();

      if ((userData.mgcBalance || 0) < SUPPORT_COST) {
        throw new HttpsError('failed-precondition', `رصيد MGC غير كافٍ! تحتاج ${SUPPORT_COST} MGC`);
      }

      if (userData.disabled === true) {
        throw new HttpsError('permission-denied', 'الحساب محظور');
      }

      // خصم من الداعم
      tx.update(userRef, {
        mgcBalance: admin.firestore.FieldValue.increment(-SUPPORT_COST),
      });

      // إضافة شعبية و XP للمستهدف
      tx.update(targetRef, {
        popularity: admin.firestore.FieldValue.increment(1),
        xp: admin.firestore.FieldValue.increment(5),
      });

      // تسجيل العملية
      const activityRef = db.collection('support_activities').doc();
      tx.set(activityRef, {
        fromUserId: uid,
        toUserId: targetUserId,
        type: 'popularity',
        value: 1,
        cost: SUPPORT_COST,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    logger.info(`✅ المستخدم ${uid} دعم المستخدم ${targetUserId}`);
    return { success: true };

  } catch (error) {
    logger.error('❌ فشل دعم المستخدم:', error);
    throw error instanceof HttpsError ? error : new HttpsError('internal', error.message);
  }
});