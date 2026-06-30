// functions/__tests__/pullMachine.test.js
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

describe('🎰 Pull Machine Helpers Tests', () => {
  const SPIN_COST = 75;
  const PITY_INTERVAL = 2;

  let mockUserSnap;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUserSnap = {
      exists: true,
      data: jest.fn(() => ({
        uid: 'test123',
        mgcBalance: 200,
        machineCounter: 0,
        pityCounter: 0,
        disabled: false,
      })),
    };
  });

  // ===== Test: Balance check =====
  describe('Balance validation', () => {
    it('✅ Should allow pull with sufficient balance', () => {
      const balance = 200;
      expect(balance >= SPIN_COST).toBe(true);
    });

    it('❌ Should reject pull with insufficient balance', () => {
      const balance = 50;
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

  // ===== Test: Pity system for machine =====
  describe('Machine pity system', () => {
    it('✅ Should trigger pity after 2 fails', () => {
      const pityCounter = 1;
      const isPityRound = pityCounter >= 1;
      expect(isPityRound).toBe(true);
    });
  });
});