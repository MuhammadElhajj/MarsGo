// functions/transactions/pullMachine.js
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { logger } = require("firebase-functions/v2");

// ===== ثوابت =====
const SPIN_COST = 25;
const PITY_INTERVAL = 500;
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW = 60;

// ===== Rate Limiting Helper =====
async function checkRateLimit(uid, action) {
  const db = admin.firestore();
  const rateRef = db.collection('rateLimits').doc(`${uid}_${action}`);
  const now = admin.firestore.Timestamp.now();

  return db.runTransaction(async (tx) => {
    const doc = await tx.get(rateRef);
    const windowStart = admin.firestore.Timestamp.fromMillis(now.toMillis() - (RATE_LIMIT_WINDOW * 1000));

    let requests = [];
    if (doc.exists) {
      requests = (doc.data().requests || []).filter(t => t.toMillis() > windowStart.toMillis());
    }

    if (requests.length >= RATE_LIMIT_MAX) {
      return { allowed: false, retryAfter: Math.ceil(RATE_LIMIT_WINDOW / 60) };
    }

    requests.push(now);
    tx.set(rateRef, { requests, updatedAt: now }, { merge: true });
    return { allowed: true, remaining: RATE_LIMIT_MAX - requests.length };
  });
}

// ===== ماكينة الحظ - Atomic مع Rate Limiting =====
exports.pullMachine = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'يجب تسجيل الدخول');
  }

  const uid = request.auth.uid;

  try {
    // 1. Rate Limiting
    const rateCheck = await checkRateLimit(uid, 'pullMachine');
    if (!rateCheck.allowed) {
      throw new HttpsError('resource-exhausted', `لقد تجاوزت الحد المسموح. يرجى الانتظار دقيقة.`);
    }

    const userRef = admin.firestore().collection('users').doc(uid);

    // 2. Atomic Transaction
    const result = await admin.firestore().runTransaction(async (tx) => {
      const userSnap = await tx.get(userRef);
      if (!userSnap.exists) throw new HttpsError('not-found', 'المستخدم غير موجود');

      const userData = userSnap.data();
      const mgcBalance = userData.mgcBalance || 0;

      if (mgcBalance < SPIN_COST) {
        throw new HttpsError('failed-precondition', `رصيد MGC غير كافٍ! تحتاج ${SPIN_COST} MGC`);
      }

      // التحقق من أن المستخدم غير محظور
      if (userData.disabled === true) {
        throw new HttpsError('permission-denied', 'الحساب محظور');
      }

      // منطق اختيار الجائزة
      let machineCounter = userData.machineCounter || 0;
      machineCounter += 1;

      const isPityRound = (machineCounter % PITY_INTERVAL === 0);
      let reward = null;
      let prizeValue = 0;
      let xpGained = 0;
      let coupon = null;

      if (isPityRound) {
        reward = getPityReward();
      } else {
        reward = getRandomMachineReward();
      }

      // تنفيذ الجائزة
      if (reward.isMGC) {
        prizeValue = reward.value;
      } else if (reward.isXP) {
        xpGained = reward.value;
      } else if (reward.isCoupon) {
        coupon = reward.coupon;
      }

      const newBalance = mgcBalance - SPIN_COST + prizeValue;

      // بناء التحديثات
      const updates = {
        mgcBalance: newBalance,
        machineCounter: machineCounter,
        pityCounter: (reward.isFail && !isPityRound) ? admin.firestore.FieldValue.increment(1) : 0,
      };

      if (xpGained > 0) {
        updates.xp = admin.firestore.FieldValue.increment(xpGained);
      }
      if (coupon) {
        updates.coupons = admin.firestore.FieldValue.arrayUnion(coupon);
      }

      tx.update(userRef, updates);

      // تسجيل التاريخ داخل نفس الـ Transaction
      const historyRef = admin.firestore().collection('machineHistory').doc();
      tx.set(historyRef, {
        userId: uid,
        reward: reward.label,
        prize: prizeValue,
        xp: xpGained,
        cost: SPIN_COST,
        isPity: isPityRound,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { reward, prizeValue, xpGained, isPityRound, previousBalance: mgcBalance, newBalance };
    });

    logger.info(`✅ ماكينة: user=${uid}, reward=${result.reward.label}, isPity=${result.isPityRound}`);
    return {
      success: true,
      reward: result.reward.label,
      prizeValue: result.prizeValue,
      xpGained: result.xpGained,
      isPity: result.isPityRound,
    };

  } catch (error) {
    logger.error('❌ فشل سحب الماكينة:', error);
    throw error instanceof HttpsError ? error : new HttpsError('internal', error.message);
  }
});

// ===== دوال مساعدة =====
function getPityReward() {
  const options = [
    { label: 'ربحت 100 MGC', isMGC: true, value: 100, weight: 25 },
    { label: 'ربحت 200 MGC', isMGC: true, value: 200, weight: 20 },
    { label: 'ربحت 50 MGC', isMGC: true, value: 50, weight: 30 },
    { label: 'كوبون خصم 20%', isCoupon: true, coupon: { code: `PITY${Date.now()}`, value: 20, expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 }, weight: 15 },
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
    { label: 'كوبون خصم 10%', isCoupon: true, coupon: { code: `DISCOUNT${Date.now()}`, value: 10, expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 }, weight: 5 },
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