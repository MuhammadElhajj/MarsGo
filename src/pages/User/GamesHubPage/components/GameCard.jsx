// src/pages/User/GamesHubPage/components/GameCard.jsx
import { FiArrowLeft } from 'react-icons/fi';
import './GameCard.css';

export default function GameCard({ game, onClick }) {
  const { name, description, icon, color, comingSoon } = game;

  return (
    <div
      className={`game-card ${comingSoon ? 'game-card--coming-soon' : ''}`}
      onClick={!comingSoon ? onClick : undefined}
      style={{ borderColor: color }}
    >
      <div className="game-card__icon" style={{ background: `${color}15`, color }}>
        <span className="game-card__emoji">{icon}</span>
      </div>
      <div className="game-card__info">
        <h3 className="game-card__name">{name}</h3>
        <p className="game-card__description">{description}</p>
        {comingSoon && (
          <span className="game-card__badge">قريباً</span>
        )}
      </div>
      {!comingSoon && (
        <div className="game-card__arrow">
          <FiArrowLeft size={20} />
        </div>
      )}
    </div>
  );
}