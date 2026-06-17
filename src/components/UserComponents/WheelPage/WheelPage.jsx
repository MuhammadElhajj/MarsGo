// src/pages/UserPages/WheelPage/WheelPage.jsx
import { useState } from 'react';
import Wheel from '../../../components/UserComponents/Wheel/Wheel';
import './WheelPage.css';

export default function WheelPage() {
  const [lastWin, setLastWin] = useState(null);
  const [spinCount, setSpinCount] = useState(0);

  const handleSpinComplete = (prize) => {
    setLastWin(prize);
    setSpinCount(prev => prev + 1);
  };

  return (
    <div className="wheel-page">
      <div className="wheel-page__header">
        <h1>🎡 دولاب الحظ</h1>
        <p>أدير العجلة واربح جوائز تصل إلى <strong>500 MGC</strong>!</p>
      </div>

      <div className="wheel-page__body">
        <Wheel onSpinComplete={handleSpinComplete} />
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
        <h3>📋 قواعد اللعبة</h3>
        <ul>
          <li>سعر الدخول: <strong>0.25 MGC</strong> لكل محاولة.</li>
          <li>الجوائز تتراوح بين <strong>0.5 MGC</strong> و <strong>500 MGC</strong>.</li>
          <li>كلما زادت المحاولات، زادت فرصتك بالجائزة الكبرى!</li>
          <li>الأرباح تُضاف تلقائياً إلى رصيدك.</li>
        </ul>
      </div>
    </div>
  );
}