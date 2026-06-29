// functions/transactions/transactionFunctions.js
const { onCall } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { logger } = require("firebase-functions/v2");

// ===== 1. دالة إضافة/خصم الرصيد (يدعم الرصيد الحقيقي و MGC) =====
exports.updateBalance = onCall({ cors: true }, async (request) => {
  console.log("🚀 updateBalance START");
  console.log("📥 request.auth:", request.auth);
  console.log("📥 request.data:", request.data);
  
  try {
    if (!request.auth) {
      console.log("❌ no auth");
      throw new Error("يجب تسجيل الدخول");
    }
    const uid = request.auth.uid;
    const { amount, type } = request.data;

    console.log(`📥 uid: ${uid}, amount: ${amount}, type: ${type}`);

    if (typeof amount !== 'number' || amount === 0) {
      console.log("❌ invalid amount");
      throw new Error("قيمة غير صالحة");
    }
    if (!type || (type !== 'real' && type !== 'mgc')) {
      console.log("❌ invalid type");
      throw new Error("نوع الرصيد غير صحيح (يجب أن يكون 'real' أو 'mgc')");
    }

    const userRef = admin.firestore().collection("users").doc(uid);
    const fieldName = type === 'real' ? 'balance' : 'mgcBalance';
    console.log(`📥 fieldName: ${fieldName}`);

    await admin.firestore().runTransaction(async (transaction) => {
      console.log("🔁 transaction start");
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists) {
        console.log("❌ user not found");
        throw new Error("المستخدم غير موجود");
      }
      const currentBalance = userSnap.data()[fieldName] || 0;
      console.log(`📊 currentBalance: ${currentBalance}`);
      const newBalance = currentBalance + amount;
      console.log(`📊 newBalance: ${newBalance}`);
      if (newBalance < 0) {
        console.log("❌ insufficient balance");
        throw new Error(`الرصيد (${type === 'real' ? 'الحقيقي' : 'MGC'}) غير كافٍ`);
      }
      transaction.update(userRef, { [fieldName]: newBalance });
      console.log("✅ transaction committed");
    });

    logger.info(`✅ تم تحديث رصيد المستخدم ${uid} (${type}) بمبلغ ${amount}`);
    console.log("✅ updateBalance SUCCESS");
    return { success: true };
  } catch (error) {
    console.error("❌ updateBalance ERROR:", error);
    logger.error("❌ فشل تحديث الرصيد:", error);
    throw new Error(error.message);
  }
});

// ===== 2. دالة شراء MGC (تحويل من USD إلى MGC) =====
exports.buyMgc = onCall({ cors: true }, async (request) => {
  if (!request.auth) throw new Error("يجب تسجيل الدخول");
  const uid = request.auth.uid;
  const { mgcAmount, priceUSD } = request.data;

  if (mgcAmount <= 0 || priceUSD <= 0) throw new Error("بيانات غير صالحة");

  const userRef = admin.firestore().collection("users").doc(uid);

  try {
    await admin.firestore().runTransaction(async (transaction) => {
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists) throw new Error("المستخدم غير موجود");
      
      const userData = userSnap.data();
      if ((userData.balance || 0) < priceUSD) {
        throw new Error("الرصيد الحقيقي غير كافٍ");
      }

      transaction.update(userRef, {
        balance: (userData.balance || 0) - priceUSD,
        mgcBalance: (userData.mgcBalance || 0) + mgcAmount,
      });
    });

    // تسجيل عملية الشراء
    await admin.firestore().collection("mgcPurchases").add({
      userId: uid,
      mgcAmount: mgcAmount,
      priceUSD: priceUSD,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    throw new Error(error.message);
  }
});

// ===== 3. دالة بيع MGC (تحويل من MGC إلى USD) =====
exports.sellMgc = onCall({ cors: true }, async (request) => {
  if (!request.auth) throw new Error("يجب تسجيل الدخول");
  const uid = request.auth.uid;
  const { mgcAmount } = request.data;
  const RATE = 0.007; // يجب جلبها من مكان مركزي لاحقاً

  if (mgcAmount <= 0) throw new Error("الكمية غير صالحة");

  const userRef = admin.firestore().collection("users").doc(uid);

  try {
    await admin.firestore().runTransaction(async (transaction) => {
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists) throw new Error("المستخدم غير موجود");
      
      const userData = userSnap.data();
      if ((userData.mgcBalance || 0) < mgcAmount) {
        throw new Error("رصيد MGC غير كافٍ");
      }

      const usdAmount = mgcAmount * RATE;

      transaction.update(userRef, {
        mgcBalance: (userData.mgcBalance || 0) - mgcAmount,
        balance: (userData.balance || 0) + usdAmount,
      });
    });
    return { success: true };
  } catch (error) {
    throw new Error(error.message);
  }
});

// ===== 4. إنشاء طلب جديد بأمان (مع خصم الرصيد) =====
exports.createSecureOrder = onCall({ cors: true }, async (request) => {
  if (!request.auth) throw new Error("يجب تسجيل الدخول");
  const uid = request.auth.uid;
  const orderData = request.data;

  const { finalPriceUSD } = orderData;

  if (!finalPriceUSD || finalPriceUSD <= 0) throw new Error("سعر غير صالح");

  const userRef = admin.firestore().collection("users").doc(uid);
  let orderRef;

  try {
    await admin.firestore().runTransaction(async (transaction) => {
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists) throw new Error("المستخدم غير موجود");
      
      const userData = userSnap.data();
      if ((userData.balance || 0) < finalPriceUSD) {
        throw new Error("الرصيد غير كافٍ لتنفيذ الطلب");
      }

      // 1. خصم الرصيد
      transaction.update(userRef, {
        balance: (userData.balance || 0) - finalPriceUSD,
      });

      // 2. إنشاء الطلب داخل المعاملة
      const newOrderRef = admin.firestore().collection("orders").doc();
      transaction.set(newOrderRef, {
        ...orderData,
        userId: uid,
        status: 'pending_verification', // أو 'completed' حسب سير العمل
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        paidByBalance: true,
      });
      orderRef = newOrderRef;
    });

    return { success: true, orderId: orderRef.id };
  } catch (error) {
    throw new Error(error.message);
  }
});