// src/components/UserComponents/Gaming/GamesList/GamesList.jsx
import { useNavigate } from 'react-router-dom';
import { useGames } from '../../../../context/GamesContext';
import Loading from '../../../GeneralComponents/Loading/Loading';
import GoBackButton from '../../../GeneralComponents/GoBackButton/GoBackButton';
import GameCard from '../GameCard/GameCard'; // استيراد المكون المنفصل
import './GamesList.css';

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
      <div className="games-grid">
        {games.map(game => (
          <GameCard key={game.id} game={game} onSelect={handleGameClick} />
        ))}
      </div>
    </div>
  );
}