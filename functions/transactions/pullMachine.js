// functions/transactions/pullMachine.js
const { onCall } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { logger } = require("firebase-functions/v2");

/**
 * ماكينة الحظ - الإصدار الجديد
 * - التكلفة: 25 MGC
 * - نظام التعويض: كل 500 دورة، 70% جوائز متوسطة، 30% جوائز عالية
 * - جوائز متنوعة: MGC, XP, كوبونات, ألقاب
 */
exports.pullMachine = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new Error("يجب تسجيل الدخول");
  }
  const uid = request.auth.uid;
  const SPIN_COST = 25;

  try {
    const userRef = admin.firestore().collection("users").doc(uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) throw new Error("المستخدم غير موجود");
    const userData = userSnap.data();
    const mgcBalance = userData.mgcBalance || 0;

    if (mgcBalance < SPIN_COST) {
      throw new Error(`رصيد MGC غير كافٍ! تحتاج ${SPIN_COST} MGC`);
    }

    // ===== نظام التعويض =====
    let pityCounter = userData.pityCounter || 0;
    let machineCounter = userData.machineCounter || 0;
    machineCounter += 1;

    // كل 500 دورة، نضمن جائزة مميزة
    const isPityRound = (machineCounter % 500 === 0);

    // اختيار الجائزة
    let reward = null;
    let prizeValue = 0;
    let xpGained = 0;
    let coupon = null;

    if (isPityRound) {
      // دورة تعويض: جائزة مضمونة (MGC أو كوبون)
      reward = getPityReward();
    } else {
      // دورات عادية: اختيار عشوائي مع وزن
      reward = getRandomMachineReward();
    }

    // تنفيذ الجائزة
    if (reward.isMGC) {
      prizeValue = reward.value;
    } else if (reward.isXP) {
      xpGained = reward.value;
    } else if (reward.isCoupon) {
      coupon = reward.coupon;
    } else if (reward.isTitle) {
      // سيتم إضافة اللقب لاحقاً
    }

    // خصم التكلفة وإضافة المكاسب
    const newBalance = mgcBalance - SPIN_COST + prizeValue;
    const updates = {
      mgcBalance: newBalance,
      machineCounter: machineCounter,
      pityCounter: (reward.isFail && !isPityRound) ? pityCounter + 1 : 0,
    };

    if (xpGained > 0) {
      updates.xp = admin.firestore.FieldValue.increment(xpGained);
      // تحديث المستوى تلقائياً (يمكن إضافة منطق لاحقاً)
    }
    if (coupon) {
      updates.coupons = admin.firestore.FieldValue.arrayUnion(coupon);
    }

    await userRef.update(updates);

    // تسجيل التاريخ
    await admin.firestore().collection("machineHistory").add({
      userId: uid,
      reward: reward.label,
      prize: prizeValue,
      xp: xpGained,
      cost: SPIN_COST,
      isPity: isPityRound,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info(`✅ ماكينة: user=${uid}, reward=${reward.label}, isPity=${isPityRound}`);
    return { success: true, reward: reward.label, prizeValue, xpGained, isPity: isPityRound };

  } catch (error) {
    logger.error("❌ فشل سحب الماكينة:", error);
    throw new Error(error.message);
  }
});

// ===== دوال مساعدة =====

function getPityReward() {
  // جوائز مضمونة للدورات التعويضية
  const options = [
    { label: 'ربحت 100 MGC', isMGC: true, value: 100, weight: 25 },
    { label: 'ربحت 200 MGC', isMGC: true, value: 200, weight: 20 },
    { label: 'ربحت 50 MGC', isMGC: true, value: 50, weight: 30 },
    { label: 'كوبون خصم 20%', isCoupon: true, coupon: { code: `PITY${Date.now()}`, value: 20, expiresAt: Date.now() + 30*24*60*60*1000 }, weight: 15 },
    { label: '+150 XP', isXP: true, value: 150, weight: 10 },
  ];
  return weightedRandomMachine(options);
}

function getRandomMachineReward() {
  const options = [
    { label: 'لا شيء', isFail: true, value: 0, weight: 20 },
    { label: 'ربحت 1 MGC', isMGC: true, value: 1, weight: 15 },
    { label: 'ربحت 2 MGC', isMGC: true, value: 2, weight: 12 },
    { label: 'ربحت 4 MGC', isMGC: true, value: 4, weight: 10 },
    { label: 'ربحت 8 MGC', isMGC: true, value: 8, weight: 8 },
    { label: 'ربحت 16 MGC', isMGC: true, value: 16, weight: 6 },
    { label: 'ربحت 32 MGC', isMGC: true, value: 32, weight: 4 },
    { label: '+50 XP', isXP: true, value: 50, weight: 8 },
    { label: '+100 XP', isXP: true, value: 100, weight: 5 },
    { label: 'كوبون خصم 10%', isCoupon: true, coupon: { code: `DISCOUNT${Date.now()}`, value: 10, expiresAt: Date.now() + 30*24*60*60*1000 }, weight: 5 },
    { label: 'لقب جديد', isTitle: true, weight: 1 },
  ];
  return weightedRandomMachine(options);
}

function weightedRandomMachine(options) {
  const totalWeight = options.reduce((a, b) => a + b.weight, 0);
  let random = Math.random() * totalWeight;
  for (const opt of options) {
    random -= opt.weight;
    if (random <= 0) return opt;
  }
  return options[0];
}