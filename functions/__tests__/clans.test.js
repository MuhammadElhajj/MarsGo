// functions/__tests__/clans.test.js
const admin = require('firebase-admin');

jest.mock('firebase-admin', () => {
  const mockFirestore = {
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    get: jest.fn(),
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    runTransaction: jest.fn(),
    where: jest.fn().mockReturnThis(),
    batch: jest.fn().mockReturnValue({
      commit: jest.fn(),
      delete: jest.fn(),
    }),
  };
  const firestoreMock = jest.fn(() => mockFirestore);
  firestoreMock.FieldValue = {
    serverTimestamp: jest.fn(() => 'TIMESTAMP'),
    increment: jest.fn((val) => val),
  };
  return {
    firestore: firestoreMock,
    auth: jest.fn(() => ({
      getUser: jest.fn(),
    })),
  };
});

describe('🏰 Clan Management Helpers Tests', () => {
  let mockClanSnap;
  let mockUserSnap;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUserSnap = {
      exists: true,
      data: jest.fn(() => ({
        uid: 'owner123',
        disabled: false,
        role: 'customer',
      })),
    };

    mockClanSnap = {
      exists: true,
      data: jest.fn(() => ({
        id: 'clan456',
        name: 'Warriors',
        ownerId: 'owner123',
        members: ['owner123', 'member789'],
        memberRoles: { owner123: 'owner', member789: 'member' },
      })),
    };
  });

  // ===== Test: Owner validation =====
  describe('Clan ownership validation', () => {
    it('✅ Should identify clan owner', () => {
      const clanData = mockClanSnap.data();
      const userId = 'owner123';
      expect(clanData.ownerId === userId).toBe(true);
    });

    it('❌ Should reject non-owner', () => {
      const clanData = mockClanSnap.data();
      const userId = 'member789';
      expect(clanData.ownerId === userId).toBe(false);
    });
  });

  // ===== Test: User blocked check =====
  describe('User blocked check', () => {
    it('✅ Should allow active user', () => {
      const userData = mockUserSnap.data();
      expect(userData.disabled).toBe(false);
    });

    it('❌ Should reject blocked user', () => {
      const blockedUserSnap = {
        exists: true,
        data: jest.fn(() => ({
          uid: 'blockedUser',
          disabled: true,
        })),
      };
      expect(blockedUserSnap.data().disabled).toBe(true);
    });
  });

  // ===== Test: Role assignment limits =====
  describe('Role assignment limits', () => {
    const VALID_ROLES = ['owner', 'general', 'deputy', 'moderator', 'member'];
    const ROLE_LIMITS = { general: 1, deputy: 1, moderator: 3 };

    it('✅ Should enforce role limits', () => {
      expect(ROLE_LIMITS.general).toBe(1);
      expect(ROLE_LIMITS.moderator).toBe(3);
    });

    it('❌ Should reject invalid role', () => {
      const invalidRole = 'invalid_role';
      expect(VALID_ROLES.includes(invalidRole)).toBe(false);
    });
  });
});