// functions/clans/clanManagement.js
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const { logger } = require('firebase-functions/v2');

const VALID_ROLES = ['owner', 'general', 'deputy', 'moderator', 'member'];
const ROLE_LIMITS = { general: 1, deputy: 1, moderator: 3 };

/**
 * تعيين دور لعضو في الكلان (المالك فقط) - Atomic
 */
exports.assignClanRole = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'يجب تسجيل الدخول');
  }

  const uid = request.auth.uid;
  const { clanId, targetUid, newRole } = request.data;

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

    logger.info(`✅ المستخدم ${uid} غير دور المستخدم ${targetUid} إلى ${newRole}`);
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
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'يجب تسجيل الدخول');
  }

  const uid = request.auth.uid;
  const { clanId } = request.data;

  if (!clanId) {
    throw new HttpsError('invalid-argument', 'معرف الكلان مطلوب');
  }

  const db = admin.firestore();

  try {
    await db.runTransaction(async (tx) => {
      const clanRef = db.collection('clans').doc(clanId);
      const clanSnap = await tx.get(clanRef);

      if (!clanSnap.exists) {
        throw new HttpsError('not-found', 'الكلان غير موجود');
      }

      const clanData = clanSnap.data();

      if (clanData.ownerId !== uid) {
        throw new HttpsError('permission-denied', 'المالك فقط يمكنه حذف الكلان');
      }

      // حذف الكلان
      tx.delete(clanRef);

      // حذف غرفة الدردشة
      const roomRef = db.collection('rooms').doc(`clan_${clanId}`);
      tx.delete(roomRef);

      // حذف الدعوات (نستخدم batch داخل transaction)
      // ملاحظة: Firestore transaction لا يسمح بـ get() بعد write()
      // لذلك نجيب الدعوات برا الـ transaction
    });

    // حذف الدعوات برا الـ transaction (بسبب قيود Firestore)
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

    logger.info(`✅ المستخدم ${uid} حذف الكلان ${clanId}`);
    return { success: true, message: 'تم حذف الكلان بنجاح' };

  } catch (error) {
    logger.error('❌ فشل حذف الكلان:', error);
    throw error instanceof HttpsError ? error : new HttpsError('internal', error.message);
  }
});