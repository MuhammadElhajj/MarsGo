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
// const telegramBot = require('./telegramBot/telegramBot');
// exports.telegramWebhook = telegramBot.telegramWebhook;

// ==================== دالة وسيطة للمتجر الخارجي ====================
exports.externalStoreProxy = require('./externalStoreProxy').externalStoreProxy;


// ==================== استيراد المنتجات من متجر خارجي (لوحة المدير) ====================
exports.importProductsFromExternal = require('./admin/importFromExternal').importProductsFromExternal;