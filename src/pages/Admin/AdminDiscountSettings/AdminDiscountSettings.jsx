// src/pages/Admin/AdminDiscountSettings.jsx
import { useState, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAppStore } from '../../../store/store';
import Button from '../../../components/GeneralComponents/Button/Button';
import Input from '../../../components/GeneralComponents/Input/Input';
import toast from 'react-hot-toast';
import './AdminDiscountSettings.css';

export default function AdminDiscountSettings() {
  // ✅ استخدم الـ store فقط
  const discounts = useAppStore((state) => state.discounts);
  const setDiscounts = useAppStore((state) => state.setDiscounts);
  const games = useAppStore((state) => state.games);
  const apps = useAppStore((state) => state.apps);

  const [form, setForm] = useState({ games: 0, apps: 0, specific: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (discounts) {
      setForm(discounts);
      setLoading(false);
    } else {
      // إذا لم تكن موجودة، نضع قيماً افتراضية
      setForm({ games: 0, apps: 0, specific: {} });
      setLoading(false);
    }
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
    try {
      const docRef = doc(db, 'discountSettings', 'default');
      await setDoc(docRef, form, { merge: true });
      setDiscounts(form); // تحديث الـ store
      toast.success('تم حفظ إعدادات الخصم بنجاح');
    } catch (err) {
      console.error(err);
      toast.error('فشل حفظ الإعدادات');
    }
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