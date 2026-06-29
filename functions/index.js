// functions/index.js
const admin = require('firebase-admin');

// تهيئة Firebase Admin مرة واحدة فقط
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// ==================== التحقق والمصادقة ====================
const verification = require('./verification/verification');
exports.sendVerificationCode = verification.sendVerificationCode;
exports.verifyCode = verification.verifyCode;
exports.checkEmailVerified = verification.checkEmailVerified;
exports.sendPasswordResetCode = verification.sendPasswordResetCode;
exports.verifyPasswordResetCode = verification.verifyPasswordResetCode;
exports.disableUser = verification.disableUser;

// ==================== سعر الصرف ====================
exports.updateExchangeRate = require('./autoUpdate').updateExchangeRate;
exports.manualUpdateExchangeRate = require('./manualUpdate').manualUpdateExchangeRate;

// ==================== الإشعارات ====================
const telegramNotifications = require('./notifications/telegram');
exports.sendOrderNotification = telegramNotifications.sendOrderNotification;
exports.sendDepositNotification = telegramNotifications.sendDepositNotification;
exports.telegramDepositWebhook = require('./telegramBot/telegramBot').telegramDepositWebhook;

// ==================== المعاملات المالية ====================
const tx = require('./transactions/transactionFunctions');
exports.updateBalance = tx.updateBalance;
exports.buyMgc = tx.buyMgc;
exports.sellMgc = tx.sellMgc;
exports.createSecureOrder = tx.createSecureOrder;

const spinWheelModule = require('./transactions/spinWheel');
exports.spinWheel = spinWheelModule.spinWheel;

const pullMachineModule = require('./transactions/pullMachine');
exports.pullMachine = pullMachineModule.pullMachine;

// ==================== دعم المستخدمين ====================
exports.supportUser = require('./referral/supportUser').supportUser;

// ==================== الإحالات والكلانات ====================
exports.claimReferralRewards = require('./referral/claimReward').claimReferralRewards;
exports.assignClanRole = require('./clans/clanManagement').assignClanRole;
exports.deleteClan = require('./clans/clanManagement').deleteClan;

// ==================== أدوات المدير ====================
exports.externalStoreProxy = require('./externalStoreProxy').externalStoreProxy;
exports.importProductsFromExternal = require('./admin/importFromExternal').importProductsFromExternal;
exports.updateCategoryIds = require('./updateCategoryIds').updateCategoryIds;