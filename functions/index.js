const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

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
exports.sendOrderNotification = require('./notifications/telegram').sendOrderNotification;
exports.sendDepositNotification = require('./notifications/telegram').sendDepositNotification;
exports.telegramDepositWebhook = require('./telegramBot/telegramBot').telegramDepositWebhook;

// ==================== المعاملات المالية ====================
const tx = require('./transactions/transactionFunctions');
exports.updateBalance = tx.updateBalance;
exports.buyMgc = tx.buyMgc;
exports.sellMgc = tx.sellMgc;
exports.createSecureOrder = tx.createSecureOrder;
exports.spinWheel = require('./transactions/spinWheel').spinWheel;
exports.pullMachine = require('./transactions/pullMachine').pullMachine;

// ==================== الإحالات والكلانات ====================
exports.claimReferralRewards = require('./referral/claimReward').claimReferralRewards;
exports.assignClanRole = require('./clans/clanManagement').assignClanRole;
exports.deleteClan = require('./clans/clanManagement').deleteClan;

// ==================== أدوات المدير ====================
exports.externalStoreProxy = require('./externalStoreProxy').externalStoreProxy;
exports.importProductsFromExternal = require('./admin/importFromExternal').importProductsFromExternal;
exports.updateCategoryIds = require('./updateCategoryIds').updateCategoryIds;