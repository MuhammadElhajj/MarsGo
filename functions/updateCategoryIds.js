// functions/updateCategoryIds.js
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const { logger } = require('firebase-functions/v2');

/**
 * تحديث categoryId للمنتجات المستوردة من المتجر الخارجي
 * (للمدير فقط)
 */
exports.updateCategoryIds = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'يجب تسجيل الدخول');
  }

  const userDoc = await admin.firestore()
    .collection('users')
    .doc(request.auth.uid)
    .get();

  if (userDoc.data()?.role !== 'admin') {
    throw new HttpsError('permission-denied', 'ليس لديك صلاحية');
  }

  try {
    const snapshot = await admin.firestore()
      .collection('products')
      .where('categoryId', '==', 'services')
      .get();

    let updatedCount = 0;
    const batch = admin.firestore().batch();

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      // حدد القسم بناءً على نوع المنتج أو الاسم
      let newCategoryId = 'services';
      const name = (data.name || '').toLowerCase();

      if (name.includes('pubg') || name.includes('free fire') || name.includes('mlbb') || name.includes('game')) {
        newCategoryId = 'games';
      } else if (name.includes('app') || name.includes('تطبيق') || name.includes('شحن')) {
        newCategoryId = 'apps';
      }

      if (newCategoryId !== 'services') {
        batch.update(doc.ref, {
          categoryId: newCategoryId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        updatedCount++;
      }
    });

    await batch.commit();
    logger.info(`✅ تم تحديث ${updatedCount} منتج`);
    return { success: true, updatedCount };

  } catch (error) {
    logger.error('❌ فشل تحديث الأقسام:', error);
    throw new HttpsError('internal', error.message);
  }
});