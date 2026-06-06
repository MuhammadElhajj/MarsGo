// src/pages/Admin/AdminTopUpSettings.jsx (معدل)
import { useState, useEffect } from 'react';
import { useTopUpSettings } from '../../context/TopUpSettingsContext';
import Button from '../../components/GeneralComponents/Button/Button';
import Input from '../../components/GeneralComponents/Input/Input';
import ImageUpload from '../../components/GeneralComponents/ImageUpload/ImageUpload';
import './FinanceTopUpRequests.css';

export default function AdminTopUpSettings() {
  const { settings, loading, updateSettings } = useTopUpSettings();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (settings) {
        setForm({
          usdt: {
            enabled: settings.usdt?.enabled ?? true,
            address: settings.usdt?.address || '',
            qrCode: settings.usdt?.qrCode || '',
            network: settings.usdt?.network || 'TRC20',
          },
          shamCash: {
            enabled: settings.shamCash?.enabled ?? true,
            accountName: settings.shamCash?.accountName || '',
            accountNumber: settings.shamCash?.accountNumber || '',
            qrCode: settings.shamCash?.qrCode || '',
          },
          siretelCash: {
            enabled: settings.siretelCash?.enabled ?? true,
            accountName: settings.siretelCash?.accountName || '',
            accountNumber: settings.siretelCash?.accountNumber || '',
            qrCode: settings.siretelCash?.qrCode || '',
          },
          minDeposit: settings.minDeposit ?? 3,
          supportWhatsApp: settings.supportWhatsApp || '963939454690',
        });
      } else {
        setForm({
          usdt: { enabled: true, address: '', qrCode: '', network: 'TRC20' },
          shamCash: { enabled: true, accountName: '', accountNumber: '', qrCode: '' },
          siretelCash: { enabled: true, accountName: '', accountNumber: '', qrCode: '' },
          minDeposit: 3,
          supportWhatsApp: '963939454690',
        });
      }
      setInitializing(false);
    }
  }, [settings, loading]);

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

  if (loading || initializing) return <div className="admin-topup-loading">جاري تحميل الإعدادات...</div>;
  if (!form) return <div className="admin-topup-loading">لا يمكن تهيئة النموذج، يرجى تحديث الصفحة.</div>;

  return (
    <div className="admin-topup-settings" dir="rtl">
      <h2>⚙️ إعدادات شحن الرصيد</h2>
      <p className="admin-topup-settings__desc">قم بتفعيل طرق الدفع وإدخال بيانات الحسابات ورفع QR Codes (اختياري).</p>

      {/* USDT Card */}
      <div className="method-card">
        <div className="method-card__header">
          <h3>🇺🇸 USDT (تيثر)</h3>
          <label className="toggle-switch">
            <input type="checkbox" checked={form.usdt.enabled} onChange={(e) => handleToggle('usdt', e.target.checked)} />
            <span className="toggle-slider"></span>
          </label>
        </div>
        <div className="method-card__body">
          <Input
            label="عنوان المحفظة (Address)"
            value={form.usdt.address}
            onChange={(e) => handleMethodChange('usdt', 'address', e.target.value)}
            placeholder="TXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
          />
          <div className="form-field">
            <label>الشبكة</label>
            <select value={form.usdt.network} onChange={(e) => handleMethodChange('usdt', 'network', e.target.value)}>
              <option value="TRC20">TRC20 (Tron) - موصى به</option>
              <option value="BEP20">BEP20 (BSC)</option>
              <option value="ERC20">ERC20 (Ethereum)</option>
            </select>
          </div>
          <div className="qr-upload">
            <label>صورة QR Code (اختياري)</label>
            <ImageUpload onUploadComplete={(base64) => handleMethodChange('usdt', 'qrCode', base64)} maxSizeMB={0.5} />
            {form.usdt.qrCode && (
              <div className="qr-preview">
                <img src={form.usdt.qrCode} alt="QR" className="qr-preview-img" />
                <button type="button" onClick={() => handleMethodChange('usdt', 'qrCode', '')} className="remove-qr">إزالة</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ShamCash Card */}
      <div className="method-card">
        <div className="method-card__header">
          <h3>🏦 شام كاش</h3>
          <label className="toggle-switch">
            <input type="checkbox" checked={form.shamCash.enabled} onChange={(e) => handleToggle('shamCash', e.target.checked)} />
            <span className="toggle-slider"></span>
          </label>
        </div>
        <div className="method-card__body">
          <Input label="اسم المستفيد" value={form.shamCash.accountName} onChange={(e) => handleMethodChange('shamCash', 'accountName', e.target.value)} placeholder="الاسم الكامل للمستفيد" />
          <Input label="رقم الحساب / الهاتف" value={form.shamCash.accountNumber} onChange={(e) => handleMethodChange('shamCash', 'accountNumber', e.target.value)} placeholder="09XXXXXXXX" />
          <div className="qr-upload">
            <label>صورة QR Code (اختياري)</label>
            <ImageUpload onUploadComplete={(base64) => handleMethodChange('shamCash', 'qrCode', base64)} maxSizeMB={0.5} />
            {form.shamCash.qrCode && (
              <div className="qr-preview">
                <img src={form.shamCash.qrCode} alt="QR" className="qr-preview-img" />
                <button type="button" onClick={() => handleMethodChange('shamCash', 'qrCode', '')} className="remove-qr">إزالة</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SiretelCash Card */}
      <div className="method-card">
        <div className="method-card__header">
          <h3>📱 سيريتل كاش</h3>
          <label className="toggle-switch">
            <input type="checkbox" checked={form.siretelCash.enabled} onChange={(e) => handleToggle('siretelCash', e.target.checked)} />
            <span className="toggle-slider"></span>
          </label>
        </div>
        <div className="method-card__body">
          <Input label="اسم المستفيد" value={form.siretelCash.accountName} onChange={(e) => handleMethodChange('siretelCash', 'accountName', e.target.value)} placeholder="الاسم الكامل للمستفيد" />
          <Input label="رقم الحساب / الهاتف" value={form.siretelCash.accountNumber} onChange={(e) => handleMethodChange('siretelCash', 'accountNumber', e.target.value)} placeholder="09XXXXXXXX" />
          <div className="qr-upload">
            <label>صورة QR Code (اختياري)</label>
            <ImageUpload onUploadComplete={(base64) => handleMethodChange('siretelCash', 'qrCode', base64)} maxSizeMB={0.5} />
            {form.siretelCash.qrCode && (
              <div className="qr-preview">
                <img src={form.siretelCash.qrCode} alt="QR" className="qr-preview-img" />
                <button type="button" onClick={() => handleMethodChange('siretelCash', 'qrCode', '')} className="remove-qr">إزالة</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* General Settings */}
      <div className="general-settings">
        <h3>الإعدادات العامة</h3>
        <div className="general-row">
          <Input label="الحد الأدنى للإيداع (دولار أمريكي)" type="number" step="1" min="1" value={form.minDeposit} onChange={(e) => handleGeneralChange('minDeposit', parseInt(e.target.value) || 3)} />
          <Input label="رقم واتساب الدعم (بدون + أو مسافات)" value={form.supportWhatsApp} onChange={(e) => handleGeneralChange('supportWhatsApp', e.target.value.replace(/\D/g, ''))} placeholder="963939454690" />
        </div>
      </div>

      <div className="admin-topup-settings__actions">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'جاري الحفظ...' : '💾 حفظ الإعدادات'}
        </Button>
      </div>
    </div>
  );
}