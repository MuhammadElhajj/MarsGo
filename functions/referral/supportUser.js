const { onCall } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { logger } = require("firebase-functions/v2");

/**
 * دعم مستخدم آخر (زيادة الشعبية و XP)
 * - يتحقق من صحة المستخدمين
 * - يخصم 20 MGC من الداعم (معاملة آمنة)
 * - يزيد popularity بمقدار 1 و xp بمقدار 5 للمستهدف
 * - يسجل العملية في support_activities
 */
exports.supportUser = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new Error("يجب تسجيل الدخول");
  }

  const uid = request.auth.uid;
  const { targetUserId } = request.data;

  if (!targetUserId) {
    throw new Error("معرف المستخدم المستهدف مطلوب");
  }

  if (uid === targetUserId) {
    throw new Error("لا يمكنك دعم نفسك");
  }

  const SUPPORT_COST = 20;
  const db = admin.firestore();

  // قراءة بيانات الداعم والمستهدف في نفس الوقت
  const userRef = db.collection("users").doc(uid);
  const targetRef = db.collection("users").doc(targetUserId);

  try {
    const [userSnap, targetSnap] = await Promise.all([
      userRef.get(),
      targetRef.get(),
    ]);

    if (!userSnap.exists) throw new Error("المستخدم غير موجود");
    if (!targetSnap.exists) throw new Error("المستخدم المستهدف غير موجود");

    const userData = userSnap.data();
    const targetData = targetSnap.data();

    // التحقق من الرصيد
    if ((userData.mgcBalance || 0) < SUPPORT_COST) {
      throw new Error(`رصيد MGC غير كافٍ! تحتاج ${SUPPORT_COST} MGC`);
    }

    // تنفيذ المعاملة (Transaction)
    await db.runTransaction(async (transaction) => {
      // خصم من الداعم
      transaction.update(userRef, {
        mgcBalance: admin.firestore.FieldValue.increment(-SUPPORT_COST),
      });

      // إضافة شعبية و XP للمستهدف
      transaction.update(targetRef, {
        popularity: admin.firestore.FieldValue.increment(1),
        xp: admin.firestore.FieldValue.increment(5),
      });

      // تسجيل العملية
      const activityRef = db.collection("support_activities").doc();
      transaction.set(activityRef, {
        fromUserId: uid,
        toUserId: targetUserId,
        type: "popularity",
        value: 1,
        cost: SUPPORT_COST,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    logger.info(`✅ المستخدم ${uid} دعم المستخدم ${targetUserId} (+1 شعبية, +5 XP)`);
    return { success: true };
  } catch (error) {
    logger.error("❌ فشل دعم المستخدم:", error);
    throw new Error(error.message);
  }
});