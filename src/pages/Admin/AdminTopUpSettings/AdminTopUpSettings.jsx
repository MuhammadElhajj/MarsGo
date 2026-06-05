import { useState } from 'react';
import { useTopUpSettings } from '../../contexts/TopUpSettingsContext';
import Button from '../../../components/GeneralComponents/Button/Button';
import Input from '../../../components/GeneralComponents/Input/Input';
import ImageUpload from '../../../components/GeneralComponents/ImageUpload/ImageUpload';
import './AdminTopUpSettings.css';

export default function AdminTopUpSettings() {
  const { settings, loading, updateSettings } = useTopUpSettings();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  if (loading) return <div>جاري تحميل الإعدادات...</div>;
  if (!form && settings) setForm(JSON.parse(JSON.stringify(settings)));

  const handleChange = (method, field, value) => {
    setForm(prev => ({
      ...prev,
      [method]: { ...prev[method], [field]: value }
    }));
  };

  const handleEnableToggle = (method, enabled) => {
    setForm(prev => ({
      ...prev,
      [method]: { ...prev[method], enabled }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    await updateSettings(form);
    setSaving(false);
  };

  return (
    <div className="admin-topup-settings" dir="rtl">
      <h2>💸 إعدادات طرق الإيداع</h2>
      <p className="admin-topup-settings__desc">قم بتفعيل/تعطيل طرق الدفع وإدخال بيانات المستفيد ورفع QR Code</p>

      {/* طريقة USDT */}
      <div className="method-card">
        <div className="method-card__header">
          <h3>🇺🇸 USDT (تيثر)</h3>
          <label className="toggle-switch">
            <input type="checkbox" checked={form?.usdt?.enabled} onChange={(e) => handleEnableToggle('usdt', e.target.checked)} />
            <span className="toggle-slider"></span>
          </label>
        </div>
        <div className="method-card__body">
          <Input label="عنوان المحفظة (Address)" value={form?.usdt?.address || ''} onChange={(e) => handleChange('usdt', 'address', e.target.value)} />
          <div className="form-field">
            <label>الشبكة</label>
            <select value={form?.usdt?.network || 'TRC20'} onChange={(e) => handleChange('usdt', 'network', e.target.value)}>
              <option value="TRC20">TRC20 (Tron)</option>
              <option value="BEP20">BEP20 (BSC)</option>
              <option value="ERC20">ERC20 (Ethereum)</option>
            </select>
          </div>
          <div className="qr-upload">
            <label>صورة QR Code (اختياري)</label>
            <ImageUpload onUploadComplete={(base64) => handleChange('usdt', 'qrCode', base64)} maxSizeMB={0.5} />
            {form?.usdt?.qrCode && <img src={form.usdt.qrCode} alt="QR" className="qr-preview" />}
          </div>
        </div>
      </div>

      {/* طريقة شام كاش */}
      <div className="method-card">
        <div className="method-card__header">
          <h3>🏦 شام كاش</h3>
          <label className="toggle-switch">
            <input type="checkbox" checked={form?.shamCash?.enabled} onChange={(e) => handleEnableToggle('shamCash', e.target.checked)} />
            <span className="toggle-slider"></span>
          </label>
        </div>
        <div className="method-card__body">
          <Input label="اسم المستفيد" value={form?.shamCash?.accountName || ''} onChange={(e) => handleChange('shamCash', 'accountName', e.target.value)} />
          <Input label="رقم الحساب / الهاتف" value={form?.shamCash?.accountNumber || ''} onChange={(e) => handleChange('shamCash', 'accountNumber', e.target.value)} />
          <div className="qr-upload">
            <label>صورة QR Code (اختياري)</label>
            <ImageUpload onUploadComplete={(base64) => handleChange('shamCash', 'qrCode', base64)} maxSizeMB={0.5} />
            {form?.shamCash?.qrCode && <img src={form.shamCash.qrCode} alt="QR" className="qr-preview" />}
          </div>
        </div>
      </div>

      {/* طريقة سيريتل كاش */}
      <div className="method-card">
        <div className="method-card__header">
          <h3>📱 سيريتل كاش</h3>
          <label className="toggle-switch">
            <input type="checkbox" checked={form?.siretelCash?.enabled} onChange={(e) => handleEnableToggle('siretelCash', e.target.checked)} />
            <span className="toggle-slider"></span>
          </label>
        </div>
        <div className="method-card__body">
          <Input label="اسم المستفيد" value={form?.siretelCash?.accountName || ''} onChange={(e) => handleChange('siretelCash', 'accountName', e.target.value)} />
          <Input label="رقم الحساب / الهاتف" value={form?.siretelCash?.accountNumber || ''} onChange={(e) => handleChange('siretelCash', 'accountNumber', e.target.value)} />
          <div className="qr-upload">
            <label>صورة QR Code (اختياري)</label>
            <ImageUpload onUploadComplete={(base64) => handleChange('siretelCash', 'qrCode', base64)} maxSizeMB={0.5} />
            {form?.siretelCash?.qrCode && <img src={form.siretelCash.qrCode} alt="QR" className="qr-preview" />}
          </div>
        </div>
      </div>

      <div className="admin-topup-settings__actions">
        <Button onClick={handleSave} disabled={saving}>{saving ? 'جاري الحفظ...' : '💾 حفظ الإعدادات'}</Button>
      </div>
    </div>
  );
}