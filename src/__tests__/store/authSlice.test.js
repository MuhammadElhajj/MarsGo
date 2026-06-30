// src/__tests__/store/authSlice.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ✅ تعريف mockFirestore قبل استخدامه في vi.mock
const mockFirestore = {
  collection: vi.fn(),
  doc: vi.fn(),
  runTransaction: vi.fn(),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
};

// ✅ محاكاة firebase قبل استيراد الـ slice
vi.mock('../../firebase', () => ({
  db: mockFirestore,
}));

// ✅ استيراد slice بعد المحاكاة
import { createAuthSlice } from '../../store/slices/authSlice';

describe('🔐 Auth Slice Tests', () => {
  let slice;

  beforeEach(() => {
    vi.clearAllMocks();
    // ✅ إنشاء slice مع دوال فارغة
    slice = createAuthSlice(
      () => ({}), // set
      () => ({})  // get
    );
  });

  describe('generateUniqueId', () => {
    it('✅ Should generate unique ID with format MGC_XXXXXXXX', async () => {
      mockFirestore.runTransaction.mockImplementation(async (callback) => {
        const mockTx = {
          get: vi.fn().mockResolvedValue({
            exists: true,
            data: () => ({ uniqueIdCounter: 100 }),
          }),
          update: vi.fn(),
          set: vi.fn(),
        };
        return callback(mockTx);
      });

      const id = await slice.generateUniqueId();
      expect(id).toMatch(/^MGC_\d{8}$/);
    });

    it('✅ Should create new counter if not exists', async () => {
      mockFirestore.runTransaction.mockImplementation(async (callback) => {
        const mockTx = {
          get: vi.fn().mockResolvedValue({ exists: false }),
          set: vi.fn(),
        };
        return callback(mockTx);
      });

      const id = await slice.generateUniqueId();
      expect(id).toMatch(/^MGC_\d{8}$/);
    });
  });

  describe('searchByUniqueId', () => {
    it('✅ Should search user by unique ID', async () => {
      const mockUser = { id: 'user123', name: 'Ahmed', uniqueId: 'MGC_00000001' };
      mockFirestore.getDocs = vi.fn().mockResolvedValue({
        empty: false,
        docs: [{ id: 'user123', data: () => mockUser }],
      });

      const result = await slice.searchByUniqueId('MGC_00000001');
      expect(result).toEqual(mockUser);
    });

    it('❌ Should return null if user not found', async () => {
      mockFirestore.getDocs = vi.fn().mockResolvedValue({ empty: true });

      const result = await slice.searchByUniqueId('MGC_99999999');
      expect(result).toBeNull();
    });
  });
});