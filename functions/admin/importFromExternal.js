// functions/admin/importFromExternal.js
const { onCall } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const axios = require("axios");

exports.importProductsFromExternal = onCall(
  { cors: true },
  async (request) => {
    // التحقق من صلاحيات المدير
    if (!request.auth) throw new Error("غير مصرح");
    const userDoc = await admin.firestore().collection("users").doc(request.auth.uid).get();
    if (userDoc.data()?.role !== "admin") throw new Error("ليس لديك صلاحية");

    const { products, markupPercent = 0, globalImageUrl = null, categoryMapping = {} } = request.data;
    
    if (!products || !Array.isArray(products) || products.length === 0) {
      throw new Error("يجب توفير مصفوفة منتجات");
    }

    let importedCount = 0;
    for (const extProd of products) {
      // تحديد التصنيف الداخلي (مثلاً "games", "apps", "services")
      let categoryId = categoryMapping[extProd.category_name] || "uncategorized";
      
      // تحديد نوع المنتج (game, app, service) – يمكن استنتاجه من التصنيف أو من حقل إضافي
      let type = "service";
      if (categoryId === "games") type = "game";
      else if (categoryId === "apps") type = "app";

      // إنشاء customFields افتراضية حسب النوع
      let customFields = [];
      if (type === "game") {
        customFields = [
          { label: "معرف اللاعب (Player ID)", name: "playerId", type: "text", required: true, placeholder: "مثال: 1234567890" }
        ];
      } else if (type === "app") {
        customFields = [
          { label: "الكمية", name: "quantity", type: "number", required: true, min: 1, max: 100, defaultValue: 1 }
        ];
      } else {
        customFields = [
          { label: "ملاحظات إضافية", name: "note", type: "text", required: false, placeholder: "أي تفاصيل إضافية" }
        ];
      }

      // حساب السعر بعد نسبة الربح
      const finalPrice = extProd.price * (1 + markupPercent / 100);
      
      // الصورة: إذا وُجدت صورة خاصة بالمنتج نستخدمها، وإلا الصورة العامة
      const imageUrl = extProd.customImageUrl || globalImageUrl || extProd.image || "";

      const productData = {
        name: extProd.name,
        categoryId,
        type,
        price: finalPrice,
        originalPrice: extProd.price,
        currency: "USD",
        imageUrl,
        customFields,
        externalStore: {
          enabled: true,
          externalId: extProd.id,
          source: "external_api"
        },
        isPopular: extProd.isPopular || false,
        stock: extProd.stock ?? null,
        enabled: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await admin.firestore().collection("products").doc(extProd.id).set(productData, { merge: true });
      importedCount++;
    }

    return { success: true, count: importedCount };
  }
);