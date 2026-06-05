import { useGames } from '../../../../context/GamesContext';
import CatalogList from '../../../Generic/CatalogList/CatalogList';  // ✅ استيراد القائمة وليس الكارد
import { useNavigate } from 'react-router-dom';

export default function GamesList() {
  const { games, loading } = useGames();
  const navigate = useNavigate();

  const handleGameClick = (game) => {
    navigate(`/gaming/game/${game.id}`);   // ✅ تنتقل إلى صفحة الباقات الخاصة باللعبة
  };

  if (loading) return <div>جاري تحميل الألعاب...</div>;

  return (
    <CatalogList
      items={games}
      onItemClick={handleGameClick}
      title="اختر اللعبة"
      showBackButton={true}
      backButtonText="رجوع إلى لوحة التحكم"
    />
  );
}