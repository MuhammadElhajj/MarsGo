import { useState, useEffect } from 'react';
import { useExchangeRate } from '../../context/ExchangeRateContext';
import { getFunctions, httpsCallable } from 'firebase/functions';
import Button from '../../components/GeneralComponents/Button/Button';
import Input from '../../components/GeneralComponents/Input/Input';
import { showToast } from '../../components/GeneralComponents/ToastNotification/ToastNotification';
import './AdminExchangeRate.css';

export default function AdminExchangeRate() {
  const { rate, autoSync, updateRate, setAutoSync, manualUpdate } = useExchangeRate();
  const [newRate, setNewRate] = useState(rate || '');
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // تحديث الحقل اليدوي عند تغير السعر من context
  useEffect(() => {
    if (rate) setNewRate(rate);
  }, [rate]);

  // حفظ السعر اليدوي
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (autoSync) {
      showToast('المزامنة التلقائية مفعلة، قم بإيقافها أولاً لتحديد سعر يدوي', 'error');
      return;
    }
    const value = parseFloat(newRate);
    if (isNaN(value) || value <= 0) {
      showToast('الرجاء إدخال قيمة صحيحة أكبر من صفر', 'error');
      return;
    }
    setSaving(true);
    const success = await updateRate(value);
    if (success) {
      showToast('تم حفظ السعر اليدوي بنجاح', 'success');
    }
    setSaving(false);
  };

  // تفعيل / إيقاف المزامنة التلقائية
  const handleToggleAutoSync = async () => {
    setSyncing(true);
    const newState = !autoSync;
    const success = await setAutoSync(newState);
    if (success) {
      showToast(newState ? 'تم تفعيل المزامنة التلقائية للسعر' : 'تم إيقاف المزامنة التلقائية', 'success');
      // إذا تم التفعيل، نقوم فوراً بجلب آخر سعر من API
      if (newState && manualUpdate) {
        const result = await manualUpdate();
        if (result?.success) {
          showToast(`تم تحديث السعر إلى ${result.rate.toLocaleString()} ل.س`, 'success');
        }
      }
    } else {
      showToast('فشل تغيير حالة المزامنة', 'error');
    }
    setSyncing(false);
  };

  // تحديث يدوي فوري (زر منفصل)
  const handleManualFetch = async () => {
    if (!autoSync) {
      showToast('المزامنة التلقائية غير مفعلة. قم بتفعيلها أولاً أو استخدم الحقل اليدوي', 'error');
      return;
    }
    setSyncing(true);
    const result = await manualUpdate();
    if (result?.success) {
      showToast(`تم تحديث السعر إلى ${result.rate.toLocaleString()} ل.س`, 'success');
    } else {
      showToast('فشل تحديث السعر من المصدر الخارجي', 'error');
    }
    setSyncing(false);
  };

  if (rate === null) return <div>جاري التحميل...</div>;

  return (
    <div className="admin-exchange-rate">
      <h2>💱 إعدادات سعر صرف الدولار</h2>
      
      <div className="admin-exchange-rate__sync-status">
        <div className="sync-toggle">
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              checked={autoSync} 
              onChange={handleToggleAutoSync}
              disabled={syncing}
            />
            <span className="toggle-slider"></span>
          </label>
          <span className="sync-label">
            {autoSync ? '🟢 المزامنة التلقائية مفعلة (السعر من LiraScope)' : '🔴 المزامنة التلقائية معطلة (استخدم السعر اليدوي)'}
          </span>
        </div>
        {autoSync && (
          <Button 
            onClick={handleManualFetch} 
            disabled={syncing}
            variant="secondary"
            style={{ marginTop: '0.5rem' }}
          >
            {syncing ? 'جاري المزامنة...' : '🔄 مزامنة الآن'}
          </Button>
        )}
      </div>

      {!autoSync && (
        <form onSubmit={handleSubmit} className="admin-exchange-rate__form">
          <Input
            label="سعر الدولار مقابل الليرة السورية (يدوي)"
            type="number"
            step="1"
            value={newRate}
            onChange={(e) => setNewRate(e.target.value)}
            required
          />
          <Button type="submit" disabled={saving}>
            {saving ? 'جاري الحفظ...' : 'حفظ السعر اليدوي'}
          </Button>
        </form>
      )}

      <div className="admin-exchange-rate__current">
        <p>السعر الحالي المعروض للمستخدمين: <strong>{rate.toLocaleString()} ل.س</strong></p>
        <p className="admin-exchange-rate__note">
          {autoSync 
            ? '✓ يتم تحديث السعر تلقائياً كل ساعة من LiraScope. يمكنك الضغط على "مزامنة الآن" لتحديث فوري.'
            : '✓ المزامنة التلقائية معطلة. يمكنك إدخال السعر يدوياً وسيتم عرضه للمستخدمين.'}
        </p>
      </div>
    </div>
  );
}