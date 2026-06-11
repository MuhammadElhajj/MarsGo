import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../../../store/store';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../../../firebase';
import CatalogList from '../../../Generic/CatalogList/CatalogList';

export default function GamesList() {
  const navigate = useNavigate();
  const games = useAppStore((state) => state.games);
  const setGames = useAppStore((state) => state.setGames);
  const [loading, setLoading] = useState(!games || games.length === 0);

  useEffect(() => {
    const fetchGames = async () => {
      if (games && games.length > 0) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const q = query(collection(db, 'games'), orderBy('order', 'asc'));
        const snapshot = await getDocs(q);
        const gamesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setGames(gamesList);
      } catch (err) {
        console.error('خطأ في جلب الألعاب:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGames();
  }, [games, setGames]);

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
      type="game"
    />
  );
}