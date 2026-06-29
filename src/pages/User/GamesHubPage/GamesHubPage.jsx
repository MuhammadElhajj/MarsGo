// src/pages/User/GamesHubPage/GamesHubPage.jsx
import { useNavigate } from 'react-router-dom';
import GoBackButton from '../../../components/GeneralComponents/GoBackButton/GoBackButton';
import GameCard from './components/GameCard';
import './GamesHubPage.css';

const GAMES = [
  {
    id: 'wheel',
    name: 'دولاب الحظ',
    description: 'دور العجلة واربح جوائز تصل إلى 1000 MGC!',
    icon: '🎡',
    color: '#4f46e5',
    path: '/games-hub/wheel',
    comingSoon: false,
  },
  {
    id: 'machine',
    name: 'ماكينة الحظ',
    description: 'اسحب الجائزة الكبرى واحصل على جوائز قيمة!',
    icon: '🎰',
    color: '#f59e0b',
    path: '/games-hub/machine',
    comingSoon: false,
  },
];

export default function GamesHubPage() {
  const navigate = useNavigate();

  return (
    <div className="games-hub-page" dir="rtl">
      <div className="games-hub-page__header">
       
        <h1 className="games-hub-page__title">🎮 ألعاب الحظ</h1>
      </div>

      <p className="games-hub-page__subtitle">
        اختر لعبتك المفضلة واربح جوائز رائعة!
      </p>

      <div className="games-hub-page__grid">
        {GAMES.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            onClick={() => navigate(game.path)}
          />
        ))}
      </div>
    </div>
  );
}