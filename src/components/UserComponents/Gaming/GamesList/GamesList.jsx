import { useGames } from '../../../../context/GamesContext';
import CatalogList from '../../../Generic/CatalogList/CatalogList';
import { useNavigate } from 'react-router-dom';

export default function GamesList() {
  const { games, loading } = useGames();
  const navigate = useNavigate();

  const handleGameClick = (game) => {
    navigate(`/gaming/game/${game.id}`);
  };

  if (loading) return <div>جاري تحميل الألعاب...</div>;

  return (
    <CatalogList
      items={games}
      onItemClick={handleGameClick}
      title="اختر اللعبة"
      showBackButton={true}
      backButtonText="رجوع إلى لوحة التحكم"
      type="game"   // ✅ إضافة نوع العنصر
    />
  );
}