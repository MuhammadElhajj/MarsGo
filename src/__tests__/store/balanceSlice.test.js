// src/__tests__/store/balanceSlice.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ✅ محاكاة Firebase Functions
const mockHttpsCallable = vi.fn();

vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(),
  httpsCallable: () => mockHttpsCallable,
}));

// ✅ محاكاة firebase
vi.mock('../../firebase', () => ({
  db: {},
}));

// ✅ استيراد slice بعد المحاكاة
import { createBalanceSlice } from '../../store/slices/balanceSlice';

describe('💰 Balance Slice Tests', () => {
  let slice;
  let setState;
  let getState;

  beforeEach(() => {
    vi.clearAllMocks();
    setState = vi.fn();
    getState = vi.fn(() => ({
      balance: 100,
      mgcBalance: 50,
    }));
    slice = createBalanceSlice(setState, getState);
  });

  describe('buyMgc', () => {
    it('✅ Should buy MGC successfully with sufficient balance', async () => {
      mockHttpsCallable.mockResolvedValue({ data: { success: true } });
      const result = await slice.buyMgc(10, 5);
      expect(result).toBe(true);
      expect(setState).toHaveBeenCalled();
    });

    it('❌ Should fail if balance is insufficient', async () => {
      getState.mockImplementation(() => ({
        balance: 3,
        mgcBalance: 50,
      }));
      const result = await slice.buyMgc(10, 5);
      expect(result).toBe(false);
    });

    it('❌ Should fail if amount or price is invalid', async () => {
      const result1 = await slice.buyMgc(-5, 10);
      expect(result1).toBe(false);
      const result2 = await slice.buyMgc(5, -10);
      expect(result2).toBe(false);
    });
  });

  describe('sellMgc', () => {
    it('✅ Should sell MGC successfully with sufficient MGC balance', async () => {
      mockHttpsCallable.mockResolvedValue({ data: { success: true } });
      const result = await slice.sellMgc(10);
      expect(result).toBe(true);
    });

    it('❌ Should fail if MGC balance is insufficient', async () => {
      getState.mockImplementation(() => ({
        balance: 100,
        mgcBalance: 5,
      }));
      const result = await slice.sellMgc(10);
      expect(result).toBe(false);
    });
  });
});