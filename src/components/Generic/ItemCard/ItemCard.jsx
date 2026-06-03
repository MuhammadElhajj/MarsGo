// components/Generic/ItemCard/ItemCard.jsx
import './ItemCard.css'; // نفس تنسيق GameCard.css

export default function ItemCard({ item, onSelect }) {
  const { name, imageBase64, note, isAvailable, unavailableReason } = item;

  return (
    <div 
      className={`game-card ${!isAvailable ? 'unavailable' : ''}`} 
      onClick={() => isAvailable && onSelect(item)}
    >
      <div className="game-card__image">
        {imageBase64 ? (
          <img src={imageBase64} alt={name} />
        ) : (
          <div className="game-card__placeholder">🎮</div>
        )}
      </div>
      <div className="game-card__info">
        <h3 className="game-card__title">{name}</h3>
        {note && <p className="game-card__note">{note}</p>}
        {!isAvailable && unavailableReason && (
          <p className="game-card__unavailable-reason">⚠️ {unavailableReason}</p>
        )}
        <span className={`game-card__status status-${isAvailable ? 'available' : 'unavailable'}`}>
          {isAvailable ? 'متاحة' : 'غير متاحة'}
        </span>
      </div>
    </div>
  );
}