// src/pages/Admin/AdminDiscountSettings.jsx
import { useState, useEffect } from 'react';
import { useDiscount } from '../../../context/DiscountContext';
import Button from '../../../components/GeneralComponents/Button/Button';
import Input from '../../../components/GeneralComponents/Input/Input';
import { useGames } from '../../../context/GamesContext';
import { useApps } from '../../../context/AppsContext';
import './AdminDiscountSettings.css';

export default function AdminDiscountSettings() {
  const { discounts, updateDiscounts, loading } = useDiscount();
  const { games } = useGames();
  const { apps } = useApps();
  const [form, setForm] = useState({ games: 0, apps: 0, specific: {} });

  useEffect(() => {
    if (discounts) setForm(discounts);
  }, [discounts]);

  const handleGeneralChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  const handleSpecificChange = (type, id, value) => {
    const key = `${type}_${id}`;
    const percent = parseFloat(value) || 0;
    setForm(prev => ({
      ...prev,
      specific: { ...prev.specific, [key]: percent }
    }));
  };

  const handleSave = async () => {
    await updateDiscounts(form);
    alert('تم حفظ إعدادات الخصم');
  };

  if (loading) return <div>جاري التحميل...</div>;

  return (
    <div className="admin-discount-settings">
      <h2>🏷️ إدارة الخصومات</h2>
      <div className="section">
        <h3>خصومات عامة</h3>
        <Input label="خصم على جميع الألعاب (%)" type="number" value={form.games}
               onChange={e => handleGeneralChange('games', e.target.value)} />
        <Input label="خصم على جميع التطبيقات (%)" type="number" value={form.apps}
               onChange={e => handleGeneralChange('apps', e.target.value)} />
      </div>

      <div className="section">
        <h3>خصومات خاصة بالألعاب</h3>
        <div className="items-grid">
          {games.map(game => (
            <div key={game.id} className="item-row">
              <span>{game.name}</span>
              <Input type="number" min="0" max="100"
                     value={form.specific[`game_${game.id}`] || 0}
                     onChange={e => handleSpecificChange('game', game.id, e.target.value)} />
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <h3>خصومات خاصة بالتطبيقات</h3>
        <div className="items-grid">
          {apps.map(app => (
            <div key={app.id} className="item-row">
              <span>{app.name}</span>
              <Input type="number" min="0" max="100"
                     value={form.specific[`app_${app.id}`] || 0}
                     onChange={e => handleSpecificChange('app', app.id, e.target.value)} />
            </div>
          ))}
        </div>
      </div>

      <Button onClick={handleSave}>💾 حفظ جميع الإعدادات</Button>
    </div>
  );
}