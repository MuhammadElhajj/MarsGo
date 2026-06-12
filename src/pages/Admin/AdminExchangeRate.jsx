import { useState, useEffect } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAppStore } from '../../store/store';
import Button from '../../components/GeneralComponents/Button/Button';
import Input from '../../components/GeneralComponents/Input/Input';
import { showToast } from '../../components/GeneralComponents/ToastNotification/ToastNotification';
import './AdminExchangeRate.css';

export default function AdminExchangeRate() {
  const exchangeRate = useAppStore((state) => state.exchangeRate);
  const autoSync = useAppStore((state) => state.autoSyncExchangeRate);
  const setExchangeRate = useAppStore((state) => state.setExchangeRate);
  const setAutoSync = useAppStore((state) => state.setAutoSyncExchangeRate);

  const [newRate, setNewRate] = useState(exchangeRate || '');
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const functions = getFunctions();
  const manualUpdateCallable = httpsCallable(functions, 'manualUpdateExchangeRate');

  useEffect(() => {
    if (exchangeRate) setNewRate(exchangeRate);
  }, [exchangeRate]);

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
    try {
      setExchangeRate(value);
      showToast('تم حفظ السعر اليدوي بنجاح', 'success');
    } catch (err) {
      showToast('فشل حفظ السعر', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAutoSync = async () => {
    setSyncing(true);
    const newState = !autoSync;
    try {
      setAutoSync(newState);
      showToast(newState ? 'تم تفعيل المزامنة التلقائية للسعر' : 'تم إيقاف المزامنة التلقائية', 'success');
      if (newState) {
        const result = await manualUpdateCallable();
        if (result.data?.success) {
          setExchangeRate(result.data.rate);
          showToast(`تم تحديث السعر إلى ${result.data.rate.toLocaleString()} ل.س`, 'success');
        }
      }
    } catch (err) {
      showToast('فشل تغيير حالة المزامنة', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleManualFetch = async () => {
    if (!autoSync) {
      showToast('المزامنة التلقائية غير مفعلة. قم بتفعيلها أولاً أو استخدم الحقل اليدوي', 'error');
      return;
    }
    setSyncing(true);
    try {
      const result = await manualUpdateCallable();
      if (result.data?.success) {
        setExchangeRate(result.data.rate);
        showToast(`تم تحديث السعر إلى ${result.data.rate.toLocaleString()} ل.س`, 'success');
      } else {
        showToast('فشل تحديث السعر من المصدر الخارجي', 'error');
      }
    } catch (err) {
      showToast('فشل تحديث السعر', 'error');
    } finally {
      setSyncing(false);
    }
  };

  if (exchangeRate === null) return <div>جاري التحميل...</div>;

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
        <p>السعر الحالي المعروض للمستخدمين: <strong>{exchangeRate.toLocaleString()} ل.س</strong></p>
        <p className="admin-exchange-rate__note">
          {autoSync 
            ? '✓ يتم تحديث السعر تلقائياً كل 15 دقيقة من LiraScope. يمكنك الضغط على "مزامنة الآن" لتحديث فوري.'
            : '✓ المزامنة التلقائية معطلة. يمكنك إدخال السعر يدوياً وسيتم عرضه للمستخدمين.'}
        </p>
      </div>
    </div>
  );
}