// functions/clans/clanManagement.js
const { onCall } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { logger } = require("firebase-functions/v2");

/**
 * تعيين دور لعضو في الكلان (المالك فقط)
 * - يتحقق من أن المستخدم هو مالك الكلان
 * - يتحقق من صحة الدور الجديد
 * - يحدّث دور العضو في الكلان
 */
exports.assignClanRole = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new Error("يجب تسجيل الدخول");
  }

  const uid = request.auth.uid;
  const { clanId, targetUid, newRole } = request.data;

  if (!clanId || !targetUid || !newRole) {
    throw new Error("جميع الحقول مطلوبة: clanId, targetUid, newRole");
  }

  const db = admin.firestore();
  const clanRef = db.collection("clans").doc(clanId);

  try {
    // 1. قراءة بيانات الكلان
    const clanSnap = await clanRef.get();
    if (!clanSnap.exists) {
      throw new Error("الكلان غير موجود");
    }

    const clanData = clanSnap.data();

    // 2. التحقق من أن المستخدم الحالي هو المالك
    if (clanData.ownerId !== uid) {
      throw new Error("المالك فقط يمكنه تغيير المناصب");
    }

    // 3. التحقق من أن المستخدم المستهدف عضو في الكلان
    if (!clanData.members || !clanData.members.includes(targetUid)) {
      throw new Error("المستخدم المستهدف ليس عضواً في هذا الكلان");
    }

    // 4. التحقق من صحة الدور الجديد
    const validRoles = ["owner", "general", "deputy", "moderator", "member"];
    if (!validRoles.includes(newRole)) {
      throw new Error(`دور غير صالح. الأدوار المتاحة: ${validRoles.join(", ")}`);
    }

    // 5. منع تغيير دور المالك (لا يمكن تعيين مالك آخر)
    if (newRole === "owner") {
      throw new Error("لا يمكن تعيين مالك جديد. فقط المالك الحالي يمكنه نقل الملكية عبر عملية منفصلة.");
    }

    // 6. التحقق من القيود (عدد المناصب)
    const currentRoles = clanData.memberRoles || {};
    const generalCount = Object.values(currentRoles).filter(r => r === "general").length;
    const deputyCount = Object.values(currentRoles).filter(r => r === "deputy").length;
    const moderatorCount = Object.values(currentRoles).filter(r => r === "moderator").length;

    if (newRole === "general" && generalCount >= 1) {
      throw new Error("يوجد جينرال واحد فقط في الكلان");
    }
    if (newRole === "deputy" && deputyCount >= 1) {
      throw new Error("يوجد عميد واحد فقط في الكلان");
    }
    if (newRole === "moderator" && moderatorCount >= 3) {
      throw new Error("الحد الأقصى للمشرفين هو 3");
    }

    // 7. تحديث دور العضو
    await clanRef.update({
      [`memberRoles.${targetUid}`]: newRole,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info(`✅ المستخدم ${uid} غير دور المستخدم ${targetUid} إلى ${newRole} في الكلان ${clanId}`);
    return { success: true, message: "تم تغيير المنصب بنجاح" };
  } catch (error) {
    logger.error("❌ فشل تغيير المنصب:", error);
    throw new Error(error.message);
  }
});

/**
 * حذف الكلان (المالك فقط)
 * - يتحقق من أن المستخدم هو مالك الكلان
 * - يحذف الكلان وجميع بياناته المرتبطة (الغرفة، الدعوات، ...)
 */
exports.deleteClan = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new Error("يجب تسجيل الدخول");
  }

  const uid = request.auth.uid;
  const { clanId } = request.data;

  if (!clanId) {
    throw new Error("معرف الكلان مطلوب");
  }

  const db = admin.firestore();
  const clanRef = db.collection("clans").doc(clanId);

  try {
    // 1. قراءة بيانات الكلان
    const clanSnap = await clanRef.get();
    if (!clanSnap.exists) {
      throw new Error("الكلان غير موجود");
    }

    const clanData = clanSnap.data();

    // 2. التحقق من أن المستخدم هو المالك
    if (clanData.ownerId !== uid) {
      throw new Error("المالك فقط يمكنه حذف الكلان");
    }

    // 3. حذف الكلان
    await clanRef.delete();

    // 4. حذف غرفة الدردشة المرتبطة (إن وجدت)
    const roomId = `clan_${clanId}`;
    try {
      await db.collection("rooms").doc(roomId).delete();
    } catch (roomErr) {
      logger.warn(`⚠️ فشل حذف الغرفة ${roomId}:`, roomErr.message);
    }

    // 5. حذف جميع الدعوات المرتبطة بالكلان
    const invitesQuery = await db.collection("clanInvites")
      .where("clanId", "==", clanId)
      .get();
    const batch = db.batch();
    invitesQuery.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    logger.info(`✅ المستخدم ${uid} حذف الكلان ${clanId}`);
    return { success: true, message: "تم حذف الكلان بنجاح" };
  } catch (error) {
    logger.error("❌ فشل حذف الكلان:", error);
    throw new Error(error.message);
  }
});