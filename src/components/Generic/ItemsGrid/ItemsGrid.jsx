// components/Generic/ItemsGrid/ItemsGrid.jsx
import ItemCard from '../ItemCard/ItemCard';
import './ItemsGrid.css'; // نفس تنسيق GamesList.css

export default function ItemsGrid({ items, onItemClick, title, backButton }) {
  return (
    <div className="gaming-page" dir="rtl">
      {backButton && <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '1rem' }}>{backButton}</div>}
      {title && <h2 className="gaming-page__title">{title}</h2>}
      <div className="games-grid">
        {items.map(item => (
          <ItemCard key={item.id} item={item} onSelect={onItemClick} />
        ))}
      </div>
    </div>
  );
}