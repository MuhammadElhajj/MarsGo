import { useNavigate } from 'react-router-dom';
import { useGames } from '../../../context/GamesContext';
import Loading from '../../../components/GeneralComponents/Loading/Loading';
import GoBackButton from '../../../components/GeneralComponents/GoBackButton/GoBackButton';
import './GamingPage.css';

// بطاقة اللعبة بشكل عمودي (لشبكة Grid)
function GameCard({ game, onSelect }) {
  const { name, imageBase64, note, isAvailable, unavailableReason } = game;

  return (
    <div 
      className={`game-card ${!isAvailable ? 'unavailable' : ''}`} 
      onClick={() => isAvailable && onSelect(game)}
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

export default function GamesList() {
  const { games, loading } = useGames();
  const navigate = useNavigate();

  const handleGameClick = (game) => {
    navigate(`/gaming/game/${game.id}`);
  };

  if (loading) return <Loading text="جاري تحميل الألعاب..." />;

  return (
    <div className="gaming-page" dir="rtl">
      <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '1rem' }}>
        <GoBackButton text="رجوع إلى لوحة التحكم" />
      </div>
      <h2 className="gaming-page__title">اختر اللعبة</h2>
      <div className="games-grid">   {/* ✅ استخدمنا .games-grid بدلاً من .games-grid-horizontal */}
        {games.map(game => (
          <GameCard key={game.id} game={game} onSelect={handleGameClick} />
        ))}
      </div>
    </div>
  );
}