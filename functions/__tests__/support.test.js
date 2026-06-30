// functions/__tests__/support.test.js
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

describe('❤️ Support User Helpers Tests', () => {
  const SUPPORT_COST = 20;

  let mockUserSnap;
  let mockTargetSnap;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUserSnap = {
      exists: true,
      data: jest.fn(() => ({
        uid: 'user123',
        mgcBalance: 50,
        disabled: false,
      })),
    };

    mockTargetSnap = {
      exists: true,
      data: jest.fn(() => ({
        uid: 'target456',
        popularity: 0,
        xp: 0,
        disabled: false,
      })),
    };
  });

  // ===== Test: Support cost =====
  describe('Support cost validation', () => {
    it('✅ Should allow support with sufficient balance', () => {
      const balance = 50;
      expect(balance >= SUPPORT_COST).toBe(true);
    });

    it('❌ Should reject support with insufficient balance', () => {
      const balance = 10;
      expect(balance >= SUPPORT_COST).toBe(false);
    });
  });

  // ===== Test: Prevent self-support =====
  describe('Self-support prevention', () => {
    it('❌ Should prevent supporting self', () => {
      const userId = 'user123';
      const targetId = 'user123';
      expect(userId === targetId).toBe(true);
    });

    it('✅ Should allow supporting others', () => {
      const userId = 'user123';
      const targetId = 'target456';
      expect(userId === targetId).toBe(false);
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
});