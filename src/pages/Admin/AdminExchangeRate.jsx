import { useState } from 'react';
import { useExchangeRate } from '../../context/ExchangeRateContext';
import Button from '../../components/GeneralComponents/Button/Button';
import Input from '../../components/GeneralComponents/Input/Input';
import './AdminExchangeRate.css';

export default function AdminExchangeRate() {
  const { rate, updateRate } = useExchangeRate();
  const [newRate, setNewRate] = useState(rate || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const value = parseFloat(newRate);
    if (isNaN(value) || value <= 0) {
      alert('الرجاء إدخال قيمة صحيحة أكبر من صفر');
      return;
    }
    setSaving(true);
    await updateRate(value);
    setSaving(false);
  };

  if (rate === null) return <div>جاري التحميل...</div>;

  return (
    <div className="admin-exchange-rate">
      <h2>💱 إعدادات سعر صرف الدولار</h2>
      <form onSubmit={handleSubmit} className="admin-exchange-rate__form">
        <Input
          label="سعر الدولار مقابل الليرة السورية"
          type="number"
          step="1"
          value={newRate}
          onChange={(e) => setNewRate(e.target.value)}
          required
        />
        <Button type="submit" disabled={saving}>
          {saving ? 'جاري الحفظ...' : 'حفظ السعر'}
        </Button>
      </form>
      <p className="admin-exchange-rate__note">
        سيتم عرض هذا السعر في لوحة المستخدمين والمدققين.
      </p>
    </div>
  );
}