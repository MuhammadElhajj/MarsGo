// src/__tests__/components/UnifiedCheckout.test.jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// ✅ محاكاة firebase والـ store
vi.mock('../../firebase', () => ({
  db: {},
}));

vi.mock('../../store/store', () => ({
  useAppStore: vi.fn((selector) =>
    selector({
      balance: 100,
      userData: { uid: 'test123', name: 'Test User' },
      addNotification: vi.fn(),
    })
  ),
}));

// ✅ استيراد المكون بعد المحاكاة
import UnifiedCheckout from '../../components/Generic/UnifiedCheckout/UnifiedCheckout';

describe('💳 UnifiedCheckout Component Tests', () => {
  const mockPackage = {
    id: 'pkg1',
    name: 'PUBG 100 UC',
    price: 10,
    discount: 5,
    imageUrl: 'pubg.jpg',
  };

  const mockItem = {
    id: 'game1',
    name: 'PUBG Mobile',
    type: 'game',
  };

  it('✅ Should display product name and price correctly', () => {
    render(
      <BrowserRouter>
        <UnifiedCheckout
          product={mockPackage}
          item={mockItem}
          serviceType="gaming"
        />
      </BrowserRouter>
    );
    expect(screen.getByText('PUBG 100 UC')).toBeDefined();
    expect(screen.getByText('10 $')).toBeDefined();
  });

  it('✅ Should display user balance', () => {
    render(
      <BrowserRouter>
        <UnifiedCheckout
          product={mockPackage}
          item={mockItem}
          serviceType="gaming"
        />
      </BrowserRouter>
    );
    expect(screen.getByText('100.00 $')).toBeDefined();
  });
});