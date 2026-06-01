// src/pages/User/Gaming/PackagesList.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGames } from '../../../context/GamesContext';
import Loading from '../../../components/GeneralComponents/Loading/Loading';
import GoBackButton from '../../../components/GeneralComponents/GoBackButton/GoBackButton';
import './GamingPage.css';

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
          packages.map(pkg => {
            const finalPrice = pkg.discount ? (pkg.price * (1 - pkg.discount / 100)).toFixed(2) : pkg.price;
            return (
              <div key={pkg.id} className="package-card" onClick={() => handlePackageClick(pkg)}>
                <div className="package-card__info">
                  <h4 className="package-card__title">{pkg.name}</h4>
                  {pkg.type === 'royalPass' && <span className="package-card__badge">رويال باس</span>}
                  {pkg.type === 'direct' && <span className="package-card__badge">مباشر</span>}
                </div>
                <div className="package-card__price">
                  <span className="package-card__amount">{finalPrice} {pkg.currency === 'USD' ? '$' : 'ل.س'}</span>
                  {pkg.discount && <span className="package-card__old-price">{pkg.price} {pkg.currency === 'USD' ? '$' : 'ل.س'}</span>}
                  {pkg.discount && <span className="package-card__discount">خصم {pkg.discount}%</span>}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}