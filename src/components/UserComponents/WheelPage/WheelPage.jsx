// src/pages/User/WheelPage/WheelPage.jsx
import { useState } from 'react';
// ✅ استيراد الماكينة
import Machine from '../../../components/UserComponents/Machine/Machine';
// ⏸️ تعليق الدولاب مؤقتاً للاختبار
// import Wheel from '../../../components/UserComponents/Wheel/Wheel';
import './WheelPage.css';

export default function WheelPage() {
  const [lastWin, setLastWin] = useState(null);
  const [spinCount, setSpinCount] = useState(0);
  // ✅ يمكن إضافة حالة للتبويب إذا أردت لاحقاً
  // const [activeTab, setActiveTab] = useState('machine');

  const handleSpinComplete = (prize) => {
    setLastWin(prize);
    setSpinCount(prev => prev + 1);
  };

  return (
    <div className="wheel-page">
      <div className="wheel-page__header">
        {/* ✅ تحديث العنوان ليعكس ألعاب الحظ */}
        <h1>🎰 ألعاب الحظ</h1>
        <p>اختر لعبتك المفضلة واربح جوائز قيمة!</p>
      </div>

      {/* ===== قسم الألعاب ===== */}
      <div className="wheel-page__body">
        {/* ⏸️ تعليق الدولاب مؤقتاً لاختبار الماكينة */}
        {/* <Wheel onSpinComplete={handleSpinComplete} /> */}

        {/* ✅ عرض الماكينة فقط حالياً */}
        <Machine />
      </div>

      {/* ===== إحصائيات (للدولاب – يمكن إبقاؤها أو تعديلها) ===== */}
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

      {/* ===== قواعد اللعبة (يمكن تعديلها لتشمل كلا اللعبتين) ===== */}
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