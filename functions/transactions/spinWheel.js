// functions/transactions/spinWheel.js
const { onCall } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { logger } = require("firebase-functions/v2");

/**
 * دولاب الحظ - الإصدار الجديد
 * - التكلفة: 25 MGC
 * - نظام التعويض: كل 500 دورة، 70% جوائز متوسطة، 30% جوائز عالية
 * - توزيع الجوائز: 1,2,4,8,16,32,50,100,200,500 MGC
 */
exports.spinWheel = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new Error("يجب تسجيل الدخول");
  }
  const uid = request.auth.uid;
  const SPIN_COST = 25; // تكلفة الدوران الجديدة

  try {
    const userRef = admin.firestore().collection("users").doc(uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) throw new Error("المستخدم غير موجود");
    const userData = userSnap.data();
    const mgcBalance = userData.mgcBalance || 0;

    // التحقق من الرصيد
    if (mgcBalance < SPIN_COST) {
      throw new Error(`رصيد MGC غير كافٍ! تحتاج ${SPIN_COST} MGC`);
    }

    // ===== منطق اختيار الجائزة =====
    // 1. جلب عداد الدورات من المستند (أو إنشاؤه)
    let spinCounter = userData.spinCounter || 0;
    spinCounter += 1;

    // 2. تحديد ما إذا كانت هذه دورة تعويض (كل 500 دورة)
    const isPityRound = (spinCounter % 500 === 0);

    // 3. اختيار الجائزة حسب النظام الجديد
    let prize = 0;
    let prizeIndex = -1;

    if (isPityRound) {
      // دورة التعويض: 70% جوائز متوسطة، 30% جوائز عالية
      const random = Math.random();
      if (random < 0.7) {
        // 70%: جوائز متوسطة (1-32)
        prize = getMediumPrize();
      } else {
        // 30%: جوائز عالية (50-500)
        prize = getHighPrize();
      }
    } else {
      // الدورات العادية: توزيع عشوائي مع وزن حسب التوزيع المطلوب
      prize = getNormalPrize();
    }

    // 4. خصم التكلفة وإضافة الجائزة (إذا كانت > 0)
    const newBalance = mgcBalance - SPIN_COST + prize;
    await userRef.update({
      mgcBalance: newBalance,
      spinCounter: spinCounter,
    });

    // 5. تسجيل تاريخ الدوران
    await admin.firestore().collection("wheelHistory").add({
      userId: uid,
      prize: prize,
      cost: SPIN_COST,
      isPityRound: isPityRound,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info(`✅ دوران دولاب: user=${uid}, prize=${prize}, counter=${spinCounter}, isPity=${isPityRound}`);
    return { success: true, prize, spinCounter, isPityRound };

  } catch (error) {
    logger.error("❌ فشل دوران الدولاب:", error);
    throw new Error(error.message);
  }
});

// ===== دوال مساعدة لتوزيع الجوائز =====

/**
 * جوائز متوسطة (1-32) مع توزيع وزن متدرج
 */
function getMediumPrize() {
  const prizes = [1, 2, 4, 8, 16, 32];
  const weights = [30, 25, 20, 15, 7, 3]; // مجموع الأوزان = 100
  return weightedRandom(prizes, weights);
}

/**
 * جوائز عالية (50-500) مع توزيع وزن متدرج
 */
function getHighPrize() {
  const prizes = [50, 100, 200, 500];
  const weights = [40, 30, 20, 10]; // مجموع الأوزان = 100
  return weightedRandom(prizes, weights);
}

/**
 * الدورات العادية: توزيع متوازن يشمل جميع الجوائز
 */
function getNormalPrize() {
  const prizes = [1, 2, 4, 8, 16, 32, 50, 100, 200, 500];
  // أوزان متدرجة: كلما زادت الجائزة قل الوزن
  const weights = [25, 20, 17, 13, 10, 7, 4, 2, 1.5, 0.5];
  return weightedRandom(prizes, weights);
}

/**
 * دالة اختيار عشوائي مرجح
 */
function weightedRandom(items, weights) {
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) return items[i];
  }
  return items[items.length - 1];
}