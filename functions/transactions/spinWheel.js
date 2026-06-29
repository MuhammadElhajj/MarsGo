// functions/transactions/spinWheel.js
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { logger } = require("firebase-functions/v2");

// ===== ثوابت =====
const SPIN_COST = 25;
const PITY_INTERVAL = 500;
const RATE_LIMIT_MAX = 5;       // 5 دورات في الدقيقة
const RATE_LIMIT_WINDOW = 60;   // نافذة زمنية 60 ثانية

// ===== دوال مساعدة: Rate Limiting =====
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

// ===== دولاب الحظ - Atomic مع Rate Limiting =====
exports.spinWheel = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'يجب تسجيل الدخول');
  }

  const uid = request.auth.uid;

  try {
    // 1. Rate Limiting
    const rateCheck = await checkRateLimit(uid, 'spinWheel');
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

      // التحقق من الرصيد
      if (mgcBalance < SPIN_COST) {
        throw new HttpsError('failed-precondition', `رصيد MGC غير كافٍ! تحتاج ${SPIN_COST} MGC`);
      }

      // التحقق من أن المستخدم غير محظور
      if (userData.disabled === true) {
        throw new HttpsError('permission-denied', 'الحساب محظور');
      }

      // منطق اختيار الجائزة
      let spinCounter = userData.spinCounter || 0;
      spinCounter += 1;

      const isPityRound = (spinCounter % PITY_INTERVAL === 0);
      let prize = 0;

      if (isPityRound) {
        const random = Math.random();
        prize = random < 0.7 ? getMediumPrize() : getHighPrize();
      } else {
        prize = getNormalPrize();
      }

      const newBalance = mgcBalance - SPIN_COST + prize;

      // تحديث المستخدم
      tx.update(userRef, {
        mgcBalance: newBalance,
        spinCounter: spinCounter,
      });

      // تسجيل التاريخ داخل نفس الـ Transaction
      const historyRef = admin.firestore().collection('wheelHistory').doc();
      tx.set(historyRef, {
        userId: uid,
        prize: prize,
        cost: SPIN_COST,
        isPityRound: isPityRound,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { prize, spinCounter, isPityRound, previousBalance: mgcBalance, newBalance };
    });

    logger.info(`✅ دوران دولاب: user=${uid}, prize=${result.prize}, counter=${result.spinCounter}, isPity=${result.isPityRound}`);
    return {
      success: true,
      prize: result.prize,
      spinCounter: result.spinCounter,
      isPityRound: result.isPityRound,
    };

  } catch (error) {
    logger.error('❌ فشل دوران الدولاب:', error);
    throw error instanceof HttpsError ? error : new HttpsError('internal', error.message);
  }
});

// ===== دوال مساعدة لتوزيع الجوائز =====
function getMediumPrize() {
  const prizes = [1, 2, 4, 8, 16, 32];
  const weights = [30, 25, 20, 15, 7, 3];
  return weightedRandom(prizes, weights);
}

function getHighPrize() {
  const prizes = [50, 100, 200, 500];
  const weights = [40, 30, 20, 10];
  return weightedRandom(prizes, weights);
}

function getNormalPrize() {
  const prizes = [1, 2, 4, 8, 16, 32, 50, 100, 200, 500];
  const weights = [25, 20, 17, 13, 10, 7, 4, 2, 1.5, 0.5];
  return weightedRandom(prizes, weights);
}

function weightedRandom(items, weights) {
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) return items[i];
  }
  return items[items.length - 1];
}