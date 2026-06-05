import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGames } from '../../../../context/GamesContext';
import CatalogList from '../../../Generic/CatalogList/CatalogList';

export default function PackagesList() {
  const { gameId } = useParams();
  const { games, fetchPackages } = useGames();
  const [game, setGame] = useState(null);
  const [packages, setPackages] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const foundGame = games.find(g => g.id === gameId);
      setGame(foundGame);
      const pkgs = await fetchPackages(gameId);
      setPackages(pkgs);
    };
    load();
  }, [gameId, games]);

  const handlePackageSelect = (pkg) => {
    navigate('/gaming/checkout', { state: { item: game, package: pkg } });
  };

  if (!game) return <div>جاري التحميل...</div>;

  return (
    <CatalogList
      items={packages}
      onItemClick={handlePackageSelect}
      title={`باقات ${game.name}`}
      showBackButton={true}
      showPrice={true}
    />
  );
}