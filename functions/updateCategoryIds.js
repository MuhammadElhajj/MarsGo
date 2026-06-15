// functions/updateCategoryIds.js
const admin = require('firebase-admin');
const { onCall } = require("firebase-functions/v2/https");

// إذا كنت تريد تشغيلها كـ Cloud Function
exports.updateCategoryIds = onCall({ cors: true }, async (request) => {
  if (!request.auth) throw new Error("غير مصرح");
  const userDoc = await admin.firestore().collection("users").doc(request.auth.uid).get();
  if (userDoc.data()?.role !== "admin") throw new Error("ليس لديك صلاحية");

  const snapshot = await admin.firestore().collection('products').get();
  let updates = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    let newCategory = data.categoryId;
    if (data.categoryId === 'games' && data.name && !data.name.includes(' - ')) {
      newCategory = 'services';
      await doc.ref.update({ categoryId: newCategory });
      updates++;
    }
  }
  return { success: true, updated: updates };
});