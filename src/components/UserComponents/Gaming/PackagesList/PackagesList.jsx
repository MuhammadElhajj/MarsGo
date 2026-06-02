// src/components/UserComponents/Gaming/PackagesList/PackagesList.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGames } from '../../../../context/GamesContext';
import Loading from '../../../GeneralComponents/Loading/Loading';
import GoBackButton from '../../../GeneralComponents/GoBackButton/GoBackButton';
import PackageCard from '../PackageCard/PackageCard'; // ✅ المسار الصحيح
import './PackagesList.css';

export default function PackagesList() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { games, fetchPackages } = useGames();
  const [game, setGame] = useState(null);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGameAndPackages = async () => {
      const foundGame = games.find(g => g.id === gameId);
      if (foundGame) setGame(foundGame);
      const pkgs = await fetchPackages(gameId);
      setPackages(pkgs);
      setLoading(false);
    };
    loadGameAndPackages();
  }, [gameId, games, fetchPackages]);

  const handlePackageClick = (pkg) => {
    navigate(`/gaming/checkout/${gameId}/${pkg.id}`, { state: { game, package: pkg } });
  };

  if (loading) return <Loading text="جاري تحميل الباقات..." />;
  if (!game) return <div>اللعبة غير موجودة</div>;

  return (
    <div className="gaming-page" dir="rtl">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <GoBackButton text="رجوع إلى الألعاب" />
      </div>
      <h2 className="gaming-page__title">باقات {game.name}</h2>
      <div className="packages-grid">
        {packages.length === 0 ? (
          <p>لا توجد باقات لهذه اللعبة حالياً</p>
        ) : (
          packages.map(pkg => (
            <PackageCard key={pkg.id} pkg={pkg} onSelect={handlePackageClick} />
          ))
        )}
      </div>
    </div>
  );
}