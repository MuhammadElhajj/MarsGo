// functions/clans/clanManagement.js
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const { logger } = require('firebase-functions/v2');

const VALID_ROLES = ['owner', 'general', 'deputy', 'moderator', 'member'];
const ROLE_LIMITS = { general: 1, deputy: 1, moderator: 3 };

// ===== دالة مساعدة: التحقق من المستخدم وحالة الحظر =====
async function validateUser(uid) {
  const userRef = admin.firestore().collection('users').doc(uid);
  const snap = await userRef.get();
  if (!snap.exists) throw new HttpsError('not-found', 'المستخدم غير موجود');
  const data = snap.data();
  if (data.disabled === true) {
    throw new HttpsError('permission-denied', 'الحساب محظور، لا يمكنك إدارة الكلانات');
  }
  return { userRef, data };
}

// ===== دالة مساعدة: تسجيل في سجل التدقيق =====
async function logAudit(action, adminId, targetId, details) {
  try {
    await admin.firestore().collection('auditLogs').add({
      action,
      adminId,
      targetId,
      ...details,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (e) {
    logger.warn('⚠️ فشل تسجيل التدقيق:', e.message);
  }
}

/**
 * تعيين دور لعضو في الكلان (المالك فقط) - Atomic
 */
exports.assignClanRole = onCall({ cors: true }, async (request) => {
  // ===== التحقق من المصادقة =====
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'يجب تسجيل الدخول');
  }

  const uid = request.auth.uid;
  const { clanId, targetUid, newRole } = request.data;

  // ===== التحقق من المدخلات =====
  if (!clanId || !targetUid || !newRole) {
    throw new HttpsError('invalid-argument', 'جميع الحقول مطلوبة: clanId, targetUid, newRole');
  }
  if (!VALID_ROLES.includes(newRole)) {
    throw new HttpsError('invalid-argument', `دور غير صالح. الأدوار المتاحة: ${VALID_ROLES.join(', ')}`);
  }
  if (newRole === 'owner') {
    throw new HttpsError('invalid-argument', 'لا يمكن تعيين مالك جديد عبر هذه الدالة.');
  }
  if (uid === targetUid) {
    throw new HttpsError('invalid-argument', 'لا يمكنك تغيير دورك بنفسك');
  }

  // ===== التحقق من المستخدمين وحالة الحظر =====
  await validateUser(uid); // المستخدم المنفذ
  await validateUser(targetUid); // المستخدم المستهدف

  const db = admin.firestore();

  try {
    const result = await db.runTransaction(async (tx) => {
      const clanRef = db.collection('clans').doc(clanId);
      const clanSnap = await tx.get(clanRef);

      if (!clanSnap.exists) {
        throw new HttpsError('not-found', 'الكلان غير موجود');
      }

      const clanData = clanSnap.data();

      // التحقق من الملكية
      if (clanData.ownerId !== uid) {
        throw new HttpsError('permission-denied', 'المالك فقط يمكنه تغيير المناصب');
      }

      // التحقق من العضوية
      if (!clanData.members || !clanData.members.includes(targetUid)) {
        throw new HttpsError('failed-precondition', 'المستخدم المستهدف ليس عضواً في هذا الكلان');
      }

      // التحقق من القيود
      const currentRoles = clanData.memberRoles || {};
      const limit = ROLE_LIMITS[newRole];
      if (limit !== undefined) {
        const currentCount = Object.values(currentRoles).filter(r => r === newRole).length;
        if (currentCount >= limit) {
          throw new HttpsError('failed-precondition', `الحد الأقصى لمنصب ${newRole} هو ${limit}`);
        }
      }

      tx.update(clanRef, {
        [`memberRoles.${targetUid}`]: newRole,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { clanName: clanData.name || clanId };
    });

    // ===== تسجيل التدقيق =====
    await logAudit('assignClanRole', uid, targetUid, {
      clanId,
      newRole,
    });

    logger.info(`✅ المستخدم ${uid} غير دور المستخدم ${targetUid} إلى ${newRole} في الكلان ${clanId}`);
    return { success: true, message: 'تم تغيير المنصب بنجاح' };
  } catch (error) {
    logger.error('❌ فشل تغيير المنصب:', error);
    throw error instanceof HttpsError ? error : new HttpsError('internal', error.message);
  }
});

/**
 * حذف الكلان (المالك فقط) - Atomic
 */
exports.deleteClan = onCall({ cors: true }, async (request) => {
  // ===== التحقق من المصادقة =====
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'يجب تسجيل الدخول');
  }

  const uid = request.auth.uid;
  const { clanId } = request.data;

  // ===== التحقق من المدخلات =====
  if (!clanId) {
    throw new HttpsError('invalid-argument', 'معرف الكلان مطلوب');
  }

  // ===== التحقق من المستخدم وحالة الحظر =====
  await validateUser(uid);

  const db = admin.firestore();

  try {
    // ===== التحقق من ملكية الكلان داخل المعاملة =====
    const clanRef = db.collection('clans').doc(clanId);
    const clanSnap = await clanRef.get();
    if (!clanSnap.exists) {
      throw new HttpsError('not-found', 'الكلان غير موجود');
    }
    const clanData = clanSnap.data();
    if (clanData.ownerId !== uid) {
      throw new HttpsError('permission-denied', 'المالك فقط يمكنه حذف الكلان');
    }

    // ===== حذف الكلان =====
    await clanRef.delete();

    // ===== حذف غرفة الدردشة =====
    const roomRef = db.collection('rooms').doc(`clan_${clanId}`);
    await roomRef.delete();

    // ===== حذف الدعوات المرتبطة =====
    const invitesQuery = await db.collection('clanInvites')
      .where('clanId', '==', clanId)
      .get();
    if (!invitesQuery.empty) {
      const batch = db.batch();
      invitesQuery.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    }

    // ===== تسجيل التدقيق =====
    await logAudit('deleteClan', uid, null, {
      clanId,
      clanName: clanData.name || 'غير معروف',
    });

    logger.info(`✅ المستخدم ${uid} حذف الكلان ${clanId}`);
    return { success: true, message: 'تم حذف الكلان بنجاح' };
  } catch (error) {
    logger.error('❌ فشل حذف الكلان:', error);
    throw error instanceof HttpsError ? error : new HttpsError('internal', error.message);
  }
});