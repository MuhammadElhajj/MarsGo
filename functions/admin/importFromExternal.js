// functions/admin/importFromExternal.js
const { onCall } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { logger } = require("firebase-functions/v2");

if (admin.apps.length === 0) {
  admin.initializeApp();
}

exports.importProductsFromExternal = onCall(
  { cors: true },
  async (request) => {
    if (!request.auth) throw new Error("غير مصرح");
    const userDoc = await admin.firestore().collection("users").doc(request.auth.uid).get();
    if (userDoc.data()?.role !== "admin") throw new Error("ليس لديك صلاحية");

    const {
      products,
      markupPercent = 0,
      globalImageUrl = null,
      targetCategoryId = 'services',
      categoryMappings = {},
      hierarchicalConfig = {} // يُحتفظ به للتوافق فقط، لكن لا يُستخدم هنا
    } = request.data;

    if (!products || !Array.isArray(products) || products.length === 0) {
      throw new Error("يجب توفير مصفوفة منتجات");
    }

    let importedCount = 0;
    for (let i = 0; i < products.length; i++) {
      const extProd = products[i];

      // إنشاء معرف آمن للمنتج
      let docId = extProd.id;
      if (!docId || typeof docId !== 'string' || docId.trim() === '') {
        docId = `ext_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 6)}`;
        logger.warn(`منتج بدون id, تم إنشاء معرف جديد: ${docId}`, { name: extProd.name });
      } else {
        docId = String(docId).trim();
      }

      // 1. تحديد القسم الداخلي (categoryId) بناءً على mapping أو targetCategoryId
      const externalCat = extProd.category_name || '';
      let finalCategoryId = categoryMappings[externalCat] || targetCategoryId;

      // 2. استلام parentId من الواجهة (تم ربطه مسبقاً)
      const parentId = extProd.parentId || null;

      // 3. التحقق: إذا كان القسم هرمياً (games/apps) ولكن لا يوجد parentId، ننقل المنتج إلى الخدمات
      if ((finalCategoryId === 'games' || finalCategoryId === 'apps') && !parentId) {
        finalCategoryId = 'services';
      }

      // 4. تحديد النوع (type) والحقول المخصصة حسب القسم النهائي
      let type = 'service';
      if (finalCategoryId === 'games') type = 'game';
      else if (finalCategoryId === 'apps') type = 'app';

      let customFields = [];
      if (type === 'game') {
        customFields = [
          { label: "معرف اللاعب (Player ID)", name: "playerId", type: "text", required: true, placeholder: "مثال: 1234567890" }
        ];
      } else if (type === 'app') {
        customFields = [
          { label: "الكمية", name: "quantity", type: "number", required: true, min: 1, max: 100, defaultValue: 1 }
        ];
      } else {
        customFields = [
          { label: "ملاحظات إضافية", name: "note", type: "text", required: false, placeholder: "أي تفاصيل إضافية" }
        ];
      }

      const finalPrice = (extProd.price || 0) * (1 + markupPercent / 100);
      const imageUrl = extProd.customImageUrl || extProd.subItemImageUrl || globalImageUrl || extProd.image || "";

      // بناء كائن المنتج النهائي
      const productData = {
        name: extProd.name || "منتج بدون اسم",
        categoryId: finalCategoryId,
        parentId: parentId,                    // 🔥 الربط باستخدام المعرف الفريد
        parentImageUrl: extProd.subItemImageUrl || null,
        type,
        price: finalPrice,
        originalPrice: extProd.price || 0,
        currency: "USD",
        imageUrl,
        customFields,
        externalStore: {
          enabled: true,
          externalId: extProd.id || docId,
          source: "external_api"
        },
        isPopular: extProd.isPopular || false,
        stock: extProd.stock ?? null,
        enabled: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await admin.firestore().collection("products").doc(docId).set(productData, { merge: true });
      importedCount++;
      logger.info(`✅ تم استيراد: ${extProd.name} (${finalCategoryId} / parentId: ${parentId || 'بدون أب'})`);
    }

    return { success: true, count: importedCount };
  }
);