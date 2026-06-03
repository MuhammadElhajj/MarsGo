// // pages/User/Gaming/GamesList.jsx (أو داخل GamingPage)
// import { useGames } from '../../../../context/GamesContext';
// import ItemsGrid from '../../../Generic/ItemsGrid/ItemsGrid';
// import GoBackButton from '../../../GeneralComponents/GoBackButton/GoBackButton';
// import { useNavigate } from 'react-router-dom';
// import Loading from '../../../GeneralComponents/Loading/Loading';
// import GameCard from '../GameCard/GameCard';
// import './GamesList.css';

// export default function GamesList() {
//   const { games, loading } = useGames();
//   const navigate = useNavigate();

//   const handleGameClick = (game) => {
//     navigate(`/gaming/game/${game.id}`);
//   };

//   if (loading) return <Loading text="جاري تحميل الألعاب..." />;

//   return (
//     <ItemsGrid
//       items={games}
//       onItemClick={handleGameClick}
//       title="اختر اللعبة"
//       backButton={<GoBackButton text="رجوع إلى لوحة التحكم" />}
//     />
//   );
// }

import { useGames } from '../../../../context/GamesContext';
import ItemsGrid from '../../../Generic/ItemsGrid/ItemsGrid';
import GoBackButton from '../../../GeneralComponents/GoBackButton/GoBackButton';
import { useNavigate } from 'react-router-dom';

export default function GamesList() {
  const { games, loading } = useGames();
  const navigate = useNavigate();

  const handleGameClick = (game) => {
    navigate(`/gaming/game/${game.id}`);
  };

  if (loading) return <div>جاري تحميل الألعاب...</div>;

  return (
    <ItemsGrid
      items={games}
      onItemClick={handleGameClick}
      title="اختر اللعبة"
      backButton={<GoBackButton text="رجوع إلى لوحة التحكم" />}
    />
  );
}