import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../../../store/store';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../../../firebase';
import CatalogList from '../../../Generic/CatalogList/CatalogList';

export default function PackagesList() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const games = useAppStore((state) => state.games);
  const [game, setGame] = useState(null);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!gameId) return;
      // البحث عن اللعبة في الـ store (البيانات موجودة مسبقاً)
      const foundGame = games?.find(g => g.id === gameId);
      setGame(foundGame || null);

      // جلب الباقات من Firestore
      try {
        const q = query(collection(db, 'games', gameId, 'packages'), orderBy('order', 'asc'));
        const snapshot = await getDocs(q);
        const pkgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPackages(pkgs);
      } catch (err) {
        console.error('خطأ في جلب الباقات:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [gameId, games]);

  const handlePackageSelect = (pkg) => {
    navigate('/gaming/checkout', { state: { item: game, package: pkg } });
  };

  if (loading) return <div>جاري التحميل...</div>;
  if (!game) return <div>اللعبة غير موجودة</div>;

  return (
    <CatalogList
      items={packages}
      onItemClick={handlePackageSelect}
      title={`باقات ${game.name}`}
      showBackButton={true}
      showPrice={true}
      type="package"
      parentId={game.id}
      parentType="game"
    />
  );
}