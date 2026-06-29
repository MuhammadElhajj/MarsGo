// src/pages/User/MachinePage/MachinePage.jsx
import { useState, useEffect } from 'react';
import Machine from '../../../components/UserComponents/Machine/Machine';
import './MachinePage.css';

// ============================================================
// 🏆 مكون شريط الفائزين (PUBG-style) - نسخ من WheelPage
// ============================================================
function WinnerFeed() {
  const [winners, setWinners] = useState([]);

  const NAMES = [
    'سلطان', 'ريم', 'أحمد', 'نور', 'خالد', 'سارة', 'محمد', 'منى',
    'علي', 'هدى', 'عمر', 'ليلى', 'حسن', 'غادة', 'يوسف', 'رنا',
    'ماجد', 'دينا', 'سامي', 'روان', 'أسامة', 'جمانة', 'باسل', 'شهد'
  ];

  const PRIZES = [15, 30, 60, 90, 150, 225, 300, 600, 1500, 3000];
  const GAMES = ['ماكينة الحظ', 'الماكينة الفاخرة', 'ماكينة الجوائز', 'الماكينة الذهبية'];

  const generateRandomWinner = () => {
    const name = NAMES[Math.floor(Math.random() * NAMES.length)];
    const prize = PRIZES[Math.floor(Math.random() * PRIZES.length)];
    const game = GAMES[Math.floor(Math.random() * GAMES.length)];
    const reward = `${prize} MGC`;
    return {
      id: Date.now() + Math.random(),
      name,
      reward,
      game,
      time: new Date(),
    };
  };

  useEffect(() => {
    const initial = Array.from({ length: 5 }, generateRandomWinner);
    setWinners(initial);

    const interval = setInterval(() => {
      setWinners(prev => {
        const newWinner = generateRandomWinner();
        return [newWinner, ...prev].slice(0, 12);
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
        {winners.map((winner) => (
          <div key={winner.id} className="winner-feed__item">
            <span className="winner-feed__name">{winner.name}</span>
            <span className="winner-feed__action">ربح</span>
            <span className="winner-feed__reward">{winner.reward}</span>
            <span className="winner-feed__game">🎰 {winner.game}</span>
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
// الصفحة الرئيسية (تعرض الماكينة فقط)
// ============================================================
export default function MachinePage() {
  const [lastWin, setLastWin] = useState(null);
  const [spinCount, setSpinCount] = useState(0);

  const handleSpinComplete = (result) => {
    // result يحتوي على prizeValue أو prizeMessage
    const prize = result?.prizeValue || 0;
    if (prize > 0) {
      setLastWin(prize);
    } else {
      setLastWin(null);
    }
    setSpinCount(prev => prev + 1);
  };

  return (
    <div className="machine-page">
      <WinnerFeed />

      <div className="machine-page__header">
        <h1>🎰 ماكينة الحظ</h1>
        <p>اسحب الماكينة واربح جوائز، كوبونات، XP، وألقاب!</p>
      </div>

      <div className="machine-page__body">
        <Machine onSpinComplete={handleSpinComplete} />
      </div>

      <div className="machine-page__stats">
        <div className="machine-page__stat-card">
          <span className="stat-label">عدد مرات السحب</span>
          <span className="stat-value">{spinCount}</span>
        </div>
        <div className="machine-page__stat-card">
          <span className="stat-label">آخر ربح</span>
          <span className="stat-value" style={{ color: lastWin > 0 ? '#2ed573' : '#ff6b6b' }}>
            {lastWin !== null ? `${lastWin} MGC` : '—'}
          </span>
        </div>
        <div className="machine-page__stat-card">
          <span className="stat-label">أعلى جائزة</span>
          <span className="stat-value">3000 MGC</span>
        </div>
      </div>

      <div className="machine-page__rules">
        <h3>📋 قواعد اللعبة</h3>
        <ul>
          <li>🎰 <strong>ماكينة الحظ:</strong> سعر الدخول <strong>75 MGC</strong>، جوائز تصل إلى <strong>3000 MGC</strong>.</li>
          <li>🎁 جوائز تشمل: عملات MGC، كوبونات خصم، كوبونات شراء مجاني، نقاط XP، وألقاب نادرة.</li>
          <li>💡 نظام التعويض: بعد سحبين فاشلين، السحب الثالث مضمون بجائزة (كوبون، XP، أو لقب).</li>
          <li>جميع الأرباح تُضاف تلقائياً إلى رصيدك.</li>
        </ul>
      </div>
    </div>
  );
}