// // components/UserComponents/Gaming/PackagesList/PackagesList.jsx (معدل)
// import { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { useGames } from '../../../../context/GamesContext';
// import PackagesListView from '../../../Generic/PackagesListView/PackagesListView';

// export default function PackagesList() {
//   const { gameId } = useParams();
//   const { games, fetchPackages } = useGames();
//   const [game, setGame] = useState(null);
//   const [packages, setPackages] = useState([]);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const load = async () => {
//       const foundGame = games.find(g => g.id === gameId);
//       setGame(foundGame);
//       const pkgs = await fetchPackages(gameId);
//       setPackages(pkgs);
//     };
//     load();
//   }, [gameId, games]);

//   const handlePackageSelect = (pkg) => {
//     navigate(`/gaming/checkout/${gameId}/${pkg.id}`, { state: { game, package: pkg } });
//   };

//   if (!game) return null;

//   return (
//     <PackagesListView
//       parentName={game.name}
//       packages={packages}
//       onPackageSelect={handlePackageSelect}
//     />
//   );
// }

// src/components/UserComponents/Gaming/PackagesList/PackagesList.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGames } from '../../../../context/GamesContext';
import PackagesListView from '../../../Generic/PackagesListView/PackagesListView';

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
    <PackagesListView
      parentName={game.name}
      packages={packages}
      onPackageSelect={handlePackageSelect}
    />
  );
}