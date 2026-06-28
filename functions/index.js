// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios'); // يُستخدم في autoUpdate

admin.initializeApp();

// ==================== دوال التفعيل ====================
const verification = require('./verification/verification');
exports.sendVerificationCode = verification.sendVerificationCode;
exports.verifyCode = verification.verifyCode;
exports.checkEmailVerified = verification.checkEmailVerified;
exports.sendPasswordResetCode = verification.sendPasswordResetCode;
exports.verifyPasswordResetCode = verification.verifyPasswordResetCode;
exports.disableUser = verification.disableUser;

// ==================== دوال سعر الصرف ====================
exports.updateExchangeRate = require('./autoUpdate').updateExchangeRate;
exports.manualUpdateExchangeRate = require('./manualUpdate').manualUpdateExchangeRate;

// ==================== بوت تيليجرام (معطل حالياً) ====================
exports.sendOrderNotification = require('./notifications/telegram').sendOrderNotification;
exports.sendDepositNotification = require('./notifications/telegram').sendDepositNotification;

// ==================== دالة وسيطة للمتجر الخارجي ====================
exports.externalStoreProxy = require('./externalStoreProxy').externalStoreProxy;


// ==================== استيراد المنتجات من متجر خارجي (لوحة المدير) ====================
exports.importProductsFromExternal = require('./admin/importFromExternal').importProductsFromExternal;

// دالة تصحيح التصنيفات (تشغيل لمرة واحدة)
exports.updateCategoryIds = require('./updateCategoryIds').updateCategoryIds;


exports.updateBalance = require('./transactions/transactionFunctions').updateBalance;
exports.buyMgc = require('./transactions/transactionFunctions').buyMgc;
exports.sellMgc = require('./transactions/transactionFunctions').sellMgc;

// functions/index.js
exports.telegramDepositWebhook = require('./telegramBot/telegramBot').telegramDepositWebhook;