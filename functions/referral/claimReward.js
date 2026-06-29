// functions/referral/claimReward.js
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const { logger } = require('firebase-functions/v2');

const db = admin.firestore();

/**
 * دالة صرف مكافآت الإحالة (آمنة)
 */
exports.claimReferralRewards = onCall({ cors: true }, async (request) => {
  // 1. التحقق من المصادقة
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'يجب تسجيل الدخول');
  }
  const uid = request.auth.uid;

  // 2. قراءة بيانات المستخدم
  const userRef = db.collection('users').doc(uid);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    throw new HttpsError('not-found', 'المستخدم غير موجود');
  }
  const userData = userSnap.data();
  const referralBalance = userData.referralBalance || 0;

  // التحقق من الحساب المحظور
  if (userData.disabled === true) {
    throw new HttpsError('permission-denied', 'الحساب محظور');
  }

  // 3. التحقق من شرط الصرف (الحد الأدنى 100)
  if (referralBalance < 100) {
    throw new HttpsError('failed-precondition', `رصيد الإحالات غير كافٍ! تحتاج 100 MGC، لديك ${referralBalance} MGC`);
  }

  // 4. تنفيذ المعاملة (Transaction) لضمان الذرية
  try {
    const claimedAmount = await db.runTransaction(async (transaction) => {
      // نقرأ مرة أخرى داخل المعاملة للتأكد من عدم تغير الرصيد
      const freshSnap = await transaction.get(userRef);
      if (!freshSnap.exists) {
        throw new HttpsError('not-found', 'المستخدم غير موجود');
      }
      const freshData = freshSnap.data();
      const currentReferralBalance = freshData.referralBalance || 0;
      if (currentReferralBalance < 100) {
        throw new HttpsError('failed-precondition', 'تغير الرصيد أثناء المعاملة، حاول مرة أخرى');
      }

      // تحديث رصيد المستخدم الرئيسي
      transaction.update(userRef, {
        balance: admin.firestore.FieldValue.increment(currentReferralBalance),
        referralBalance: 0,
        totalReferralEarnings: admin.firestore.FieldValue.increment(currentReferralBalance),
      });

      // تحديث حالة جميع سجلات الإحالة المعلقة إلى 'claimed'
      const q = db.collection('referral_rewards')
        .where('referrerId', '==', uid)
        .where('status', '==', 'pending');
      const snap = await transaction.get(q);
      snap.docs.forEach((docSnap) => {
        transaction.update(docSnap.ref, {
          status: 'claimed',
          claimedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      return currentReferralBalance;
    });

    // 5. تسجيل نجاح العملية
    logger.info(`✅ تم صرف مكافآت الإحالة للمستخدم ${uid} بقيمة ${claimedAmount} MGC`);
    return { success: true, claimedAmount };
  } catch (error) {
    logger.error('❌ فشل صرف مكافآت الإحالة:', error);
    throw error instanceof HttpsError ? error : new HttpsError('internal', error.message);
  }
});