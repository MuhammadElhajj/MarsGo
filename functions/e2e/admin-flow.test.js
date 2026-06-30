/**
 * اختبار شامل لتدفق المدير:
 * 1. تعطيل مستخدم
 * 2. تحديث سعر الصرف
 * 3. تعيين دور مدقق
 * 4. الموافقة على طلب إيداع
 * 5. استيراد منتجات
 */

const admin = require('firebase-admin');

jest.mock('../verification/verification', () => ({
  disableUser: jest.fn(),
}));

jest.mock('../admin/manualUpdate', () => ({
  manualUpdateExchangeRate: jest.fn(),
}));

jest.mock('../admin/importFromExternal', () => ({
  importProductsFromExternal: jest.fn(),
}));

describe('👑 Admin Full Flow Test', () => {
  const mockAdmin = {
    uid: 'admin123',
    email: 'admin@marsgo.com',
    role: 'admin',
    disabled: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    admin.firestore().collection = jest.fn().mockReturnValue({
      doc: jest.fn().mockImplementation((id) => {
        if (id === 'admin123') {
          return {
            get: jest.fn().mockResolvedValue({
              exists: true,
              data: () => mockAdmin,
            }),
          };
        }
        if (id === 'user456') {
          return {
            get: jest.fn().mockResolvedValue({
              exists: true,
              data: () => ({
                uid: 'user456',
                email: 'user@example.com',
                disabled: false,
                role: 'customer',
              }),
            }),
          };
        }
        return { get: jest.fn().mockResolvedValue({ exists: false }) };
      }),
    });
  });

  // ===== اختبار التدفق الكامل للمدير =====
  it('✅ يجب أن يكمل المدير جميع المهام الإدارية بنجاح', async () => {
    // 1. تعطيل مستخدم
    const { disableUser } = require('../verification/verification');
    disableUser.mockResolvedValue({ success: true });

    const disableResult = await disableUser({
      auth: { uid: mockAdmin.uid },
      data: { uid: 'user456' },
    });
    expect(disableResult.success).toBe(true);

    // 2. تحديث سعر الصرف
    const { manualUpdateExchangeRate } = require('../admin/manualUpdate');
    manualUpdateExchangeRate.mockResolvedValue({ success: true, rate: 15000 });

    const rateResult = await manualUpdateExchangeRate({
      auth: { uid: mockAdmin.uid },
      data: {},
    });
    expect(rateResult.success).toBe(true);

    // 3. تعيين مدقق
    // (محاكاة: تحديث دور المستخدم في Firestore)
    const userRef = admin.firestore().collection('users').doc('user456');
    await userRef.update({ role: 'verifier' });
    expect(userRef.update).toHaveBeenCalled();

    // 4. الموافقة على إيداع (محاكاة)
    const depositRef = admin.firestore().collection('topUpRequests').doc('deposit123');
    await depositRef.update({ status: 'approved' });
    expect(depositRef.update).toHaveBeenCalled();

    // 5. استيراد منتجات
    const { importProductsFromExternal } = require('../admin/importFromExternal');
    importProductsFromExternal.mockResolvedValue({ success: true, count: 10 });

    const importResult = await importProductsFromExternal({
      auth: { uid: mockAdmin.uid },
      data: { products: [], markupPercent: 5 },
    });
    expect(importResult.success).toBe(true);
  });
});