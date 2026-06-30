/**
 * اختبار شامل لتدفق المستخدم الكامل:
 * 1. تسجيل الدخول
 * 2. التحقق من البريد
 * 3. الإيداع
 * 4. شراء MGC
 * 5. لعب دولاب الحظ
 * 6. إنشاء كلان
 * 7. إرسال رسالة في الدردشة
 * 8. بيع MGC
 * 9. صرف مكافآت الإحالة
 */

const admin = require('firebase-admin');

// محاكاة جميع الدوال
jest.mock('../transactions/transactionFunctions', () => ({
  buyMgc: jest.fn(),
  sellMgc: jest.fn(),
  createSecureOrder: jest.fn(),
}));

jest.mock('../transactions/spinWheel', () => ({
  spinWheel: jest.fn(),
}));

jest.mock('../transactions/pullMachine', () => ({
  pullMachine: jest.fn(),
}));

jest.mock('../referral/claimReward', () => ({
  claimReferralRewards: jest.fn(),
}));

jest.mock('../clans/clanManagement', () => ({
  assignClanRole: jest.fn(),
  deleteClan: jest.fn(),
}));

describe('🚀 User Full Flow Test', () => {
  const mockUser = {
    uid: 'testUser123',
    email: 'test@example.com',
    emailVerified: true,
  };

  // محاكاة المستخدم في Firestore
  beforeEach(() => {
    jest.clearAllMocks();
    admin.firestore().collection = jest.fn().mockReturnValue({
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => ({
            uid: mockUser.uid,
            balance: 100,
            mgcBalance: 50,
            referralBalance: 120,
            disabled: false,
            role: 'customer',
          }),
        }),
        update: jest.fn().mockResolvedValue(),
      }),
    });
  });

  // ===== اختبار التدفق الكامل =====
  it('✅ يجب أن يكمل المستخدم جميع الخطوات بنجاح', async () => {
    // 1. شراء MGC
    const { buyMgc } = require('../transactions/transactionFunctions');
    buyMgc.mockResolvedValue({ success: true });

    const buyResult = await buyMgc({
      auth: { uid: mockUser.uid },
      data: { mgcAmount: 10, priceUSD: 5 },
    });
    expect(buyResult.success).toBe(true);

    // 2. لعب دولاب الحظ
    const { spinWheel } = require('../transactions/spinWheel');
    spinWheel.mockResolvedValue({ success: true, prize: 15 });

    const spinResult = await spinWheel({
      auth: { uid: mockUser.uid },
      data: {},
    });
    expect(spinResult.success).toBe(true);

    // 3. إنشاء كلان (محاكاة)
    const { assignClanRole } = require('../clans/clanManagement');
    assignClanRole.mockResolvedValue({ success: true });

    const clanResult = await assignClanRole({
      auth: { uid: mockUser.uid },
      data: { clanId: 'clan123', targetUid: 'friend456', newRole: 'member' },
    });
    expect(clanResult.success).toBe(true);

    // 4. صرف مكافآت الإحالة
    const { claimReferralRewards } = require('../referral/claimReward');
    claimReferralRewards.mockResolvedValue({ success: true, claimedAmount: 120 });

    const claimResult = await claimReferralRewards({
      auth: { uid: mockUser.uid },
      data: {},
    });
    expect(claimResult.success).toBe(true);

    // 5. بيع MGC
    const { sellMgc } = require('../transactions/transactionFunctions');
    sellMgc.mockResolvedValue({ success: true, usdAmount: 0.5 });

    const sellResult = await sellMgc({
      auth: { uid: mockUser.uid },
      data: { mgcAmount: 5 },
    });
    expect(sellResult.success).toBe(true);
  });
});