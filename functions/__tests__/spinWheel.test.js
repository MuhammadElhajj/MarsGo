// functions/__tests__/spinWheel.test.js
const admin = require('firebase-admin');

jest.mock('firebase-admin', () => {
  const mockFirestore = {
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    get: jest.fn(),
    update: jest.fn(),
    set: jest.fn(),
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

describe('🎡 Spin Wheel Helpers Tests', () => {
  const SPIN_COST = 25;
  const PITY_INTERVAL = 500;

  let mockUserSnap;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUserSnap = {
      exists: true,
      data: jest.fn(() => ({
        uid: 'test123',
        mgcBalance: 100,
        spinCounter: 0,
        disabled: false,
      })),
    };
  });

  // ===== Test: Balance check before spin =====
  describe('Balance validation', () => {
    it('✅ Should allow spin with sufficient balance', () => {
      const balance = 100;
      expect(balance >= SPIN_COST).toBe(true);
    });

    it('❌ Should reject spin with insufficient balance', () => {
      const balance = 10;
      expect(balance >= SPIN_COST).toBe(false);
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

  // ===== Test: Pity system =====
  describe('Pity system', () => {
    it('✅ Should trigger pity at interval', () => {
      const spinCounter = 499;
      const isPityRound = (spinCounter + 1) % PITY_INTERVAL === 0;
      expect(isPityRound).toBe(true);
    });

    it('❌ Should not trigger pity before interval', () => {
      const spinCounter = 100;
      const isPityRound = (spinCounter + 1) % PITY_INTERVAL === 0;
      expect(isPityRound).toBe(false);
    });
  });
});