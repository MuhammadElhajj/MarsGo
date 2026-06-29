const { onCall } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { logger } = require("firebase-functions/v2");

if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();

/**
 * دالة صرف مكافآت الإحالة (آمنة)
 * يتم استدعاؤها من العميل عبر httpsCallable
 */
exports.claimReferralRewards = onCall({ cors: true }, async (request) => {
  // 1. التحقق من المصادقة
  if (!request.auth) {
    throw new Error("يجب تسجيل الدخول");
  }
  const uid = request.auth.uid;

  // 2. قراءة بيانات المستخدم من قاعدة البيانات (وليس من المدخلات)
  const userRef = db.collection("users").doc(uid);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    throw new Error("المستخدم غير موجود");
  }
  const userData = userSnap.data();
  const referralBalance = userData.referralBalance || 0;

  // 3. التحقق من شرط الصرف (الحد الأدنى 100)
  if (referralBalance < 100) {
    throw new Error(`رصيد الإحالات غير كافٍ! تحتاج 100 MGC، لديك ${referralBalance} MGC`);
  }

  // 4. تنفيذ المعاملة (Transaction) لضمان الذرية
  try {
    await db.runTransaction(async (transaction) => {
      // نقرأ مرة أخرى داخل المعاملة للتأكد من عدم تغير الرصيد
      const freshSnap = await transaction.get(userRef);
      if (!freshSnap.exists) {
        throw new Error("المستخدم غير موجود");
      }
      const freshData = freshSnap.data();
      const currentReferralBalance = freshData.referralBalance || 0;
      if (currentReferralBalance < 100) {
        throw new Error("تغير الرصيد أثناء المعاملة، حاول مرة أخرى");
      }

      // تحديث رصيد المستخدم الرئيسي (balance) وإعادة تعيين referralBalance
      transaction.update(userRef, {
        balance: admin.firestore.FieldValue.increment(currentReferralBalance),
        referralBalance: 0,
        totalReferralEarnings: admin.firestore.FieldValue.increment(currentReferralBalance),
      });

      // تحديث حالة جميع سجلات الإحالة المعلقة إلى 'claimed'
      const q = db.collection("referral_rewards")
        .where("referrerId", "==", uid)
        .where("status", "==", "pending");
      const snap = await transaction.get(q);
      snap.docs.forEach((docSnap) => {
        transaction.update(docSnap.ref, {
          status: "claimed",
          claimedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });
    });

    // 5. تسجيل نجاح العملية في السجلات
    logger.info(`✅ تم صرف مكافآت الإحالة للمستخدم ${uid} بقيمة ${referralBalance} MGC`);
    return { success: true, claimedAmount: referralBalance };
  } catch (error) {
    logger.error("❌ فشل صرف مكافآت الإحالة:", error);
    throw new Error(error.message);
  }
});