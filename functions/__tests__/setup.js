// functions/__tests__/setup.js
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

// محاكاة كاملة لـ firebase-admin
jest.mock('firebase-admin', () => {
  // نعيد كائنًا يحاكي الوظائف الأساسية
  const mockFirestore = {
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    get: jest.fn(),
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    runTransaction: jest.fn(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getCountFromServer: jest.fn(),
    add: jest.fn(), // مهم لـ logAudit
  };

  return {
    initializeApp: jest.fn(),
    firestore: jest.fn(() => mockFirestore),
    auth: jest.fn(() => ({
      getUser: jest.fn(),
      getUserByEmail: jest.fn(),
      updateUser: jest.fn(),
    })),
    FieldValue: {
      serverTimestamp: jest.fn(() => 'TIMESTAMP'),
      increment: jest.fn((val) => val),
    },
    firestore: jest.fn(() => mockFirestore), // مكرر للتأكيد
  };
});

// محاكاة axios للاختبارات التي تستخدم APIs خارجية
jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

// منع طباعة الـ logs المزعجة أثناء الاختبارات
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// محاكاة `firebase-functions` لمنع الخطأ `Cannot read properties of undefined (reading 'on')`
jest.mock('firebase-functions', () => ({
  https: {
    onCall: jest.fn(() => jest.fn()),
  },
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// محاكاة `firebase-functions/v2/https` بشكل صريح
jest.mock('firebase-functions/v2/https', () => ({
  onCall: jest.fn(() => jest.fn()),
  HttpsError: class HttpsError extends Error {
    constructor(code, message) {
      super(message);
      this.code = code;
    }
  },
}));