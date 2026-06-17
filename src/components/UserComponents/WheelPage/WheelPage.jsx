// src/pages/User/WheelPage/WheelPage.jsx
import { useState, useEffect } from 'react';
import Machine from '../../../components/UserComponents/Machine/Machine';
import './WheelPage.css';

// ============================================================
// 🏆 مكون شريط الفائزين (PUBG-style)
// ============================================================
function WinnerFeed() {
  const [winners, setWinners] = useState([]);

  // أسماء وهمية
  const NAMES = [
    'سلطان', 'ريم', 'أحمد', 'نور', 'خالد', 'سارة', 'محمد', 'منى',
    'علي', 'هدى', 'عمر', 'ليلى', 'حسن', 'غادة', 'يوسف', 'رنا',
    'ماجد', 'دينا', 'سامي', 'روان', 'أسامة', 'جمانة', 'باسل', 'شهد'
  ];

  // جوائز وهمية
  const PRIZES = [10, 15, 20, 25, 30, 50, 75, 100, 150, 200, 250, 300, 500];
  const GAMES = ['الدولاب', 'ماكينة الحظ', 'الدولاب الذهبي', 'الماكينة الفاخرة'];

  // توليد فائز عشوائي
  const generateRandomWinner = () => {
    const name = NAMES[Math.floor(Math.random() * NAMES.length)];
    const prize = PRIZES[Math.floor(Math.random() * PRIZES.length)];
    const game = GAMES[Math.floor(Math.random() * GAMES.length)];
    const isMGC = Math.random() > 0.3; // 70% MGC، 30% XP أو لقب
    const reward = isMGC ? `${prize} MGC` : Math.random() > 0.5 ? `${prize} XP` : 'لقب نادر';
    return {
      id: Date.now() + Math.random(),
      name,
      reward,
      game,
      time: new Date(),
    };
  };

  // توليد 5 فائزين أوليين
  useEffect(() => {
    const initial = Array.from({ length: 5 }, generateRandomWinner);
    setWinners(initial);

    // إضافة فائز جديد كل 4-7 ثواني
    const interval = setInterval(() => {
      setWinners(prev => {
        const newWinner = generateRandomWinner();
        return [newWinner, ...prev].slice(0, 12); // الاحتفاظ بآخر 12
      });
    }, Math.random() * 3000 + 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="winner-feed">
      <div className="winner-feed__icon">
        <span>🏆</span>
      </div>
      <div className="winner-feed__track">
        {winners.map((winner, index) => (
          <div key={winner.id} className="winner-feed__item">
            <span className="winner-feed__name">{winner.name}</span>
            <span className="winner-feed__action">ربح</span>
            <span className="winner-feed__reward">{winner.reward}</span>
            <span className="winner-feed__game">🎮 {winner.game}</span>
            <span className="winner-feed__time">
              {winner.time.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// الصفحة الرئيسية
// ============================================================
export default function WheelPage() {
  const [lastWin, setLastWin] = useState(null);
  const [spinCount, setSpinCount] = useState(0);

  const handleSpinComplete = (prize) => {
    setLastWin(prize);
    setSpinCount(prev => prev + 1);
  };

  return (
    <div className="wheel-page">
      {/* ✅ شريط الفائزين في الأعلى */}
      <WinnerFeed />

      <div className="wheel-page__header">
        <h1>🎰 ألعاب الحظ</h1>
        <p>اختر لعبتك المفضلة واربح جوائز قيمة!</p>
      </div>

      <div className="wheel-page__body">
        <Machine />
      </div>

      <div className="wheel-page__stats">
        <div className="wheel-page__stat-card">
          <span className="stat-label">عدد مرات اللعب</span>
          <span className="stat-value">{spinCount}</span>
        </div>
        <div className="wheel-page__stat-card">
          <span className="stat-label">آخر ربح</span>
          <span className="stat-value" style={{ color: lastWin > 0 ? '#2ed573' : '#ff6b6b' }}>
            {lastWin !== null ? `${lastWin} MGC` : '—'}
          </span>
        </div>
        <div className="wheel-page__stat-card">
          <span className="stat-label">أعلى جائزة</span>
          <span className="stat-value">500 MGC</span>
        </div>
      </div>

      <div className="wheel-page__rules">
        <h3>📋 قواعد الألعاب</h3>
        <ul>
          <li>🎡 <strong>الدولاب:</strong> سعر الدخول <strong>0.25 MGC</strong>، جوائز تصل إلى <strong>500 MGC</strong>.</li>
          <li>🎰 <strong>ماكينة الحظ:</strong> سعر الدخول <strong>75 MGC</strong>، جوائز تشمل عملات، كوبونات، نقاط خبرة، وألقاب.</li>
          <li>💡 نظام التعويض في الماكينة يضمن جائزة بعد سحبين فاشلين.</li>
          <li>جميع الأرباح تُضاف تلقائياً إلى رصيدك.</li>
        </ul>
      </div>
    </div>
  );
}