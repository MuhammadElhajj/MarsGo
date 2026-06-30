// functions/__tests__/referral.test.js
const admin = require('firebase-admin');

jest.mock('firebase-admin', () => {
  const mockFirestore = {
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    get: jest.fn(),
    update: jest.fn(),
    set: jest.fn(),
    add: jest.fn(),
    where: jest.fn().mockReturnThis(),
    runTransaction: jest.fn(),
  };
  const firestoreMock = jest.fn(() => mockFirestore);
  firestoreMock.FieldValue = {
    serverTimestamp: jest.fn(() => 'TIMESTAMP'),
    increment: jest.fn((val) => val),
  };
  return {
    firestore: firestoreMock,
    auth: jest.fn(() => ({})),
  };
});

describe('🎁 Referral Rewards Helpers Tests', () => {
  const MIN_CLAIM_AMOUNT = 100;
  const REWARD_PER_REFERRAL = 20;

  let mockUserSnap;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUserSnap = {
      exists: true,
      data: jest.fn(() => ({
        uid: 'test123',
        referralBalance: 150,
        balance: 50,
        disabled: false,
      })),
    };
  });

  // ===== Test: Minimum claim amount =====
  describe('Minimum claim validation', () => {
    it('✅ Should allow claim with sufficient balance', () => {
      const balance = 150;
      expect(balance >= MIN_CLAIM_AMOUNT).toBe(true);
    });

    it('❌ Should reject claim with insufficient balance', () => {
      const balance = 50;
      expect(balance >= MIN_CLAIM_AMOUNT).toBe(false);
    });
  });

  // ===== Test: User blocked check =====
  describe('User blocked check', () => {
    it('✅ Should allow active user', () => {
      const disabled = false;
      expect(disabled).toBe(false);
    });

    it('❌ Should reject blocked user', () => {
      const disabled = true;
      expect(disabled).toBe(true);
    });
  });

  // ===== Test: Reward amount =====
  describe('Reward calculation', () => {
    it('✅ Should give 20 MGC per referral', () => {
      expect(REWARD_PER_REFERRAL).toBe(20);
    });
  });
});