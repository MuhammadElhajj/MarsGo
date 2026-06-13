// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios'); // قد لا تحتاجه هنا ولكنه موجود في autoUpdate

admin.initializeApp();

// ==================== دوال التفعيل (من ملف منفصل) ====================
const verification = require('./verification/verification');
exports.sendVerificationCode = verification.sendVerificationCode;
exports.verifyCode = verification.verifyCode;
exports.checkEmailVerified = verification.checkEmailVerified;

// في index.js أضف الأسطر التالية بعد سطر verification
exports.sendPasswordResetCode = verification.sendPasswordResetCode;
exports.verifyPasswordResetCode = verification.verifyPasswordResetCode;
exports.disableUser = verification.disableUser;   // ✅ السطر المضاف فقط

// ==================== دوال سعر الصرف ====================
// تأكد من صحة المسارات: إذا كانت الملفات في مجلد exchange، استخدم './exchange/autoUpdate'
// وإذا كانت في الجذر، استخدم './autoUpdate'
// سنفترض أنك وضعت الملفين في مجلد exchange (كما تشير الأسطر الأصلية)
exports.updateExchangeRate = require('./autoUpdate').updateExchangeRate;
exports.manualUpdateExchangeRate = require('./manualUpdate').manualUpdateExchangeRate;

// ==================== بوت تيليجرام ====================
// const telegramBot = require('./telegramBot/telegramBot');
// exports.telegramWebhook = telegramBot.telegramWebhook;

exports.externalStoreProxy = require('./externalStoreProxy').externalStoreProxy;