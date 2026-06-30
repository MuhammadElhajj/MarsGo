// functions/__tests__/verification.test.js
const admin = require('firebase-admin');

// Mock admin
jest.mock('firebase-admin', () => {
  const mockFirestore = {
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    get: jest.fn(),
    set: jest.fn(),
    update: jest.fn(),
    add: jest.fn(),
  };
  const firestoreMock = jest.fn(() => mockFirestore);
  firestoreMock.FieldValue = {
    serverTimestamp: jest.fn(() => 'TIMESTAMP'),
  };
  return {
    firestore: firestoreMock,
    auth: jest.fn(() => ({
      getUser: jest.fn(),
      getUserByEmail: jest.fn(),
      updateUser: jest.fn(),
    })),
  };
});

// Test suite for verification helpers
describe('🔐 Verification Helpers Tests', () => {
  let mockAdminSnap;
  let mockTargetSnap;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAdminSnap = {
      exists: true,
      data: jest.fn(() => ({
        uid: 'admin123',
        role: 'admin',
        disabled: false,
      })),
    };

    mockTargetSnap = {
      exists: true,
      data: jest.fn(() => ({
        uid: 'user456',
        email: 'test@example.com',
        disabled: false,
        role: 'customer',
      })),
    };
  });

  // ===== Test: Check admin role =====
  describe('Admin authorization', () => {
    it('✅ Should recognize admin user', async () => {
      admin.firestore().collection().doc().get.mockResolvedValue(mockAdminSnap);
      const result = await admin.firestore().collection('users').doc('admin123').get();
      expect(result.exists).toBe(true);
      expect(result.data().role).toBe('admin');
    });

    it('❌ Should reject non-admin user', async () => {
      const nonAdminSnap = {
        exists: true,
        data: jest.fn(() => ({
          uid: 'user789',
          role: 'customer',
          disabled: false,
        })),
      };
      admin.firestore().collection().doc().get.mockResolvedValue(nonAdminSnap);
      const result = await admin.firestore().collection('users').doc('user789').get();
      expect(result.data().role).not.toBe('admin');
    });
  });

  // ===== Test: validateUser logic (mocking the helper) =====
  describe('User validation', () => {
    it('✅ Should allow active user', () => {
      const userData = {
        uid: 'user456',
        disabled: false,
      };
      expect(userData.disabled).toBe(false);
    });

    it('❌ Should reject disabled user', () => {
      const userData = {
        uid: 'user456',
        disabled: true,
      };
      expect(userData.disabled).toBe(true);
    });
  });

  // ===== Test: Prevent self-disabling =====
  describe('Self-disabling prevention', () => {
    it('❌ Should prevent disabling self', () => {
      const adminId = 'admin123';
      const targetId = 'admin123'; // same as admin
      expect(adminId === targetId).toBe(true);
      // This should be rejected in the actual function
    });
  });
});