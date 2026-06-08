// src/pages/Admin/AdminTopUpSettings.jsx
import { useState, useEffect } from 'react';
import { useTopUpSettings } from '../../contexts/TopUpSettingsContext';
import Button from '../../components/GeneralComponents/Button/Button';
import Input from '../../components/GeneralComponents/Input/Input';
import ImageUpload from '../../components/GeneralComponents/ImageUpload/ImageUpload';
import { FiSettings, FiDollarSign, FiHome, FiSmartphone, FiSave, FiGrid, FiImage } from 'react-icons/fi';
import './AdminTopUpSettings.css';

export default function AdminTopUpSettings() {
  const { settings, loading, updateSettings } = useTopUpSettings();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings && !form) {
      setForm({
        usdt: {
          enabled: settings.usdt?.enabled ?? true,
          logoImage: settings.usdt?.logoImage || '',
          displayName: settings.usdt?.displayName || 'USDT (تيثر)',
        },
        shamCash: {
          enabled: settings.shamCash?.enabled ?? true,
          logoImage: settings.shamCash?.logoImage || '',
          displayName: settings.shamCash?.displayName || 'شام كاش',
        },
        siretelCash: {
          enabled: settings.siretelCash?.enabled ?? true,
          logoImage: settings.siretelCash?.logoImage || '',
          displayName: settings.siretelCash?.displayName || 'سيريتل كاش',
        },
        minDeposit: settings.minDeposit ?? 3,
        supportWhatsApp: settings.supportWhatsApp || '963939454690',
      });
    }
  }, [settings, form]);

  const handleMethodChange = (method, field, value) => {
    setForm(prev => ({
      ...prev,
      [method]: { ...prev[method], [field]: value }
    }));
  };

  const handleToggle = (method, enabled) => {
    setForm(prev => ({
      ...prev,
      [method]: { ...prev[method], enabled }
    }));
  };

  const handleGeneralChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    await updateSettings(form);
    setSaving(false);
  };

  if (loading) return <div className="admin-topup-loading">جاري تحميل الإعدادات...</div>;
  if (!form) return <div className="admin-topup-loading">جاري تهيئة النموذج...</div>;

  return (
    <div className="admin-topup-settings" dir="rtl">
      <h2><FiSettings style={{ marginLeft: '0.5rem' }} /> إعدادات شحن الرصيد</h2>
      <p className="admin-topup-settings__desc">قم بتفعيل طرق الدفع وأضف شعار التطبيق واسمه الذي سيظهر للمستخدم.</p>

      {/* USDT */}
      <div className="method-card">
        <div className="method-card__header">
          <h3><FiDollarSign style={{ marginLeft: '0.5rem' }} /> USDT (تيثر)</h3>
          <label className="toggle-switch">
            <input type="checkbox" checked={form.usdt.enabled} onChange={(e) => handleToggle('usdt', e.target.checked)} />
            <span className="toggle-slider"></span>
          </label>
        </div>
        <div className="method-card__body">
          <Input
            label="اسم التطبيق الذي سيظهر للمستخدم"
            value={form.usdt.displayName}
            onChange={(e) => handleMethodChange('usdt', 'displayName', e.target.value)}
            placeholder="مثال: USDT (تيثر)"
          />
          <div className="qr-upload">
            <label><FiImage style={{ marginLeft: '0.3rem' }} /> شعار التطبيق (صورة)</label>
            <ImageUpload onUploadComplete={(base64) => handleMethodChange('usdt', 'logoImage', base64)} maxSizeMB={0.5} />
            {form.usdt.logoImage && (
              <div className="qr-preview">
                <img src={form.usdt.logoImage} alt="شعار USDT" style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
                <button type="button" onClick={() => handleMethodChange('usdt', 'logoImage', '')} className="remove-qr">إزالة</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* شام كاش */}
      <div className="method-card">
        <div className="method-card__header">
          <h3><FiHome style={{ marginLeft: '0.5rem' }} /> شام كاش</h3>
          <label className="toggle-switch">
            <input type="checkbox" checked={form.shamCash.enabled} onChange={(e) => handleToggle('shamCash', e.target.checked)} />
            <span className="toggle-slider"></span>
          </label>
        </div>
        <div className="method-card__body">
          <Input
            label="اسم التطبيق الذي سيظهر للمستخدم"
            value={form.shamCash.displayName}
            onChange={(e) => handleMethodChange('shamCash', 'displayName', e.target.value)}
            placeholder="مثال: شام كاش"
          />
          <div className="qr-upload">
            <label><FiImage style={{ marginLeft: '0.3rem' }} /> شعار التطبيق (صورة)</label>
            <ImageUpload onUploadComplete={(base64) => handleMethodChange('shamCash', 'logoImage', base64)} maxSizeMB={0.5} />
            {form.shamCash.logoImage && (
              <div className="qr-preview">
                <img src={form.shamCash.logoImage} alt="شعار شام كاش" style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
                <button type="button" onClick={() => handleMethodChange('shamCash', 'logoImage', '')} className="remove-qr">إزالة</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* سيريتل كاش */}
      <div className="method-card">
        <div className="method-card__header">
          <h3><FiSmartphone style={{ marginLeft: '0.5rem' }} /> سيريتل كاش</h3>
          <label className="toggle-switch">
            <input type="checkbox" checked={form.siretelCash.enabled} onChange={(e) => handleToggle('siretelCash', e.target.checked)} />
            <span className="toggle-slider"></span>
          </label>
        </div>
        <div className="method-card__body">
          <Input
            label="اسم التطبيق الذي سيظهر للمستخدم"
            value={form.siretelCash.displayName}
            onChange={(e) => handleMethodChange('siretelCash', 'displayName', e.target.value)}
            placeholder="مثال: سيريتل كاش"
          />
          <div className="qr-upload">
            <label><FiImage style={{ marginLeft: '0.3rem' }} /> شعار التطبيق (صورة)</label>
            <ImageUpload onUploadComplete={(base64) => handleMethodChange('siretelCash', 'logoImage', base64)} maxSizeMB={0.5} />
            {form.siretelCash.logoImage && (
              <div className="qr-preview">
                <img src={form.siretelCash.logoImage} alt="شعار سيريتل كاش" style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
                <button type="button" onClick={() => handleMethodChange('siretelCash', 'logoImage', '')} className="remove-qr">إزالة</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* الإعدادات العامة */}
      <div className="general-settings">
        <h3><FiGrid style={{ marginLeft: '0.5rem' }} /> الإعدادات العامة</h3>
        <div className="general-row">
          <Input
            label="الحد الأدنى للإيداع (دولار أمريكي)"
            type="number"
            step="1"
            min="1"
            value={form.minDeposit}
            onChange={(e) => handleGeneralChange('minDeposit', parseInt(e.target.value) || 3)}
          />
          <Input
            label="رقم واتساب الدعم (بدون + أو مسافات)"
            value={form.supportWhatsApp}
            onChange={(e) => handleGeneralChange('supportWhatsApp', e.target.value.replace(/\D/g, ''))}
            placeholder="963939454690"
          />
        </div>
      </div>

      <div className="admin-topup-settings__actions">
        <Button onClick={handleSave} disabled={saving}>
          <FiSave style={{ marginLeft: '0.5rem' }} />
          {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
        </Button>
      </div>
    </div>
  );
}