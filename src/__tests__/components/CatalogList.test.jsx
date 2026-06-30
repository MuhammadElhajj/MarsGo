// src/__tests__/components/CatalogList.test.jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// ✅ محاكاة firebase قبل استيراد المكون
vi.mock('../../firebase', () => ({
  db: {},
}));

// ✅ استيراد المكون بعد المحاكاة
import CatalogList from '../../components/Generic/CatalogList/CatalogList';

describe('📦 CatalogList Component Tests', () => {
  const mockItems = [
    { id: '1', name: 'لعبة PUBG', price: 10, imageUrl: 'pubg.jpg' },
    { id: '2', name: 'تطبيق Spotify', price: 5, imageUrl: 'spotify.jpg' },
  ];

  it('✅ Should display all products in the list', () => {
    render(<CatalogList items={mockItems} showPrice={true} />);
    expect(screen.getByText('لعبة PUBG')).toBeDefined();
    expect(screen.getByText('تطبيق Spotify')).toBeDefined();
  });

  it('✅ Should show empty message when list is empty', () => {
    render(<CatalogList items={[]} />);
    expect(screen.getByText('لا توجد عناصر لعرضها')).toBeDefined();
  });

  it('✅ Should call onItemClick when item is clicked', () => {
    const handleClick = vi.fn();
    render(
      <CatalogList
        items={mockItems}
        onItemClick={handleClick}
        showPrice={true}
      />
    );
    const firstItem = screen.getByText('لعبة PUBG');
    const card = firstItem.closest('.catalog-card');
    if (card) {
      card.click();
    }
    expect(handleClick).toHaveBeenCalled();
  });
});