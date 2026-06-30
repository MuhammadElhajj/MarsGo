// functions/__tests__/transactions.test.js
const admin = require('firebase-admin');
const { validateUser, logAudit } = require('../transactions/transactionFunctions');

// محاكاة كاملة لـ firebase-admin مع دعم FieldValue
jest.mock('firebase-admin', () => {
  const mockFirestore = {
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    get: jest.fn(),
    set: jest.fn(),
    update: jest.fn(),
    add: jest.fn(),
    runTransaction: jest.fn(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
  };

  // إنشاء دالة firestore وهمية
  const firestoreMock = jest.fn(() => mockFirestore);
  // إضافة FieldValue كخاصية للدالة
  firestoreMock.FieldValue = {
    serverTimestamp: jest.fn(() => 'TIMESTAMP'),
    increment: jest.fn((val) => val),
  };

  return {
    firestore: firestoreMock,
    auth: jest.fn(() => ({
      getUser: jest.fn(),
      getUserByEmail: jest.fn(),
      updateUser: jest.fn(),
    })),
    // نضيف FieldValue أيضاً في الجذر للتأكد
    FieldValue: {
      serverTimestamp: jest.fn(() => 'TIMESTAMP'),
      increment: jest.fn((val) => val),
    },
  };
});

describe('💳 Transaction Helpers Tests', () => {
  let mockUserSnap;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUserSnap = {
      exists: true,
      data: jest.fn(() => ({
        uid: 'test123',
        balance: 100,
        mgcBalance: 50,
        disabled: false,
      })),
    };

    // إعداد المحاكاة الافتراضية
    const mockFirestore = {
      collection: jest.fn().mockReturnThis(),
      doc: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue(mockUserSnap),
      update: jest.fn().mockResolvedValue(),
      add: jest.fn().mockResolvedValue({ id: 'audit123' }),
      runTransaction: jest.fn(),
    };
    // نضبط admin.firestore لتعيد mockFirestore
    admin.firestore.mockReturnValue(mockFirestore);

    // نضمن أن admin.firestore.FieldValue موجودة (قد تكون استُبدلت)
    admin.firestore.FieldValue = {
      serverTimestamp: jest.fn(() => 'TIMESTAMP'),
      increment: jest.fn((val) => val),
    };
  });

  // ===== اختبار validateUser =====
  describe('validateUser', () => {
    it('✅ يجب إرجاع بيانات المستخدم إذا كان موجوداً وغير محظور', async () => {
      const result = await validateUser('test123');
      expect(result.data).toEqual({
        uid: 'test123',
        balance: 100,
        mgcBalance: 50,
        disabled: false,
      });
    });

    it('❌ يجب رمي خطأ إذا كان المستخدم محظوراً', async () => {
      mockUserSnap.data = jest.fn(() => ({
        uid: 'test123',
        balance: 100,
        mgcBalance: 50,
        disabled: true,
      }));
      admin.firestore().doc().get.mockResolvedValue(mockUserSnap);
      await expect(validateUser('test123')).rejects.toThrow('الحساب محظور');
    });

    it('❌ يجب رمي خطأ إذا كان المستخدم غير موجود', async () => {
      admin.firestore().doc().get.mockResolvedValue({ exists: false });
      await expect(validateUser('nonexistent')).rejects.toThrow('المستخدم غير موجود');
    });
  });

  // ===== اختبار logAudit =====
  describe('logAudit', () => {
    it('✅ يجب تسجيل سجل التدقيق بنجاح', async () => {
      const mockAdd = jest.fn().mockResolvedValue({ id: 'audit123' });
      // نضبط collection بحيث تعيد كائنًا به add
      admin.firestore().collection.mockReturnValue({
        add: mockAdd,
      });

      await logAudit('test123', 'balance_update', 50, 100, 150, 'إيداع');

      expect(mockAdd).toHaveBeenCalledWith({
        userId: 'test123',
        type: 'balance_update',
        amount: 50,
        previousBalance: 100,
        newBalance: 150,
        reason: 'إيداع',
        timestamp: 'TIMESTAMP', // لأننا عرفنا serverTimestamp لتعيد 'TIMESTAMP'
      });
    });
  });
});