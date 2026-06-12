import { useState, useEffect } from 'react';
import { useAppStore } from '../../../store/store';
import Button from '../../../components/GeneralComponents/Button/Button';
import Input from '../../../components/GeneralComponents/Input/Input';
import ImageUpload from '../../../components/GeneralComponents/ImageUpload/ImageUpload';
import './AdminTopUpSettings.css';

export default function AdminTopUpSettings() {
  const topUpSettings = useAppStore((state) => state.topUpSettings);
  const updateTopUpSettings = useAppStore((state) => state.updateTopUpSettings);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (topUpSettings) {
      setForm({
        usdt: {
          enabled: topUpSettings.usdt?.enabled ?? true,
          address: topUpSettings.usdt?.address || '',
          qrCode: topUpSettings.usdt?.qrCode || '',
          network: topUpSettings.usdt?.network || 'TRC20',
          displayName: topUpSettings.usdt?.displayName || 'USDT (تيثر)',
          logoImage: topUpSettings.usdt?.logoImage || '',
        },
        shamCash: {
          enabled: topUpSettings.shamCash?.enabled ?? true,
          accountName: topUpSettings.shamCash?.accountName || '',
          accountNumber: topUpSettings.shamCash?.accountNumber || '',
          qrCode: topUpSettings.shamCash?.qrCode || '',
          displayName: topUpSettings.shamCash?.displayName || 'شام كاش',
          logoImage: topUpSettings.shamCash?.logoImage || '',
        },
        siretelCash: {
          enabled: topUpSettings.siretelCash?.enabled ?? true,
          accountName: topUpSettings.siretelCash?.accountName || '',
          accountNumber: topUpSettings.siretelCash?.accountNumber || '',
          qrCode: topUpSettings.siretelCash?.qrCode || '',
          displayName: topUpSettings.siretelCash?.displayName || 'سيريتل كاش',
          logoImage: topUpSettings.siretelCash?.logoImage || '',
        },
        minDeposit: topUpSettings.minDeposit ?? 3,
        supportWhatsApp: topUpSettings.supportWhatsApp || '963939454690',
      });
      setLoading(false);
    } else if (!topUpSettings && !form) {
      setForm({
        usdt: { enabled: true, address: '', qrCode: '', network: 'TRC20', displayName: 'USDT (تيثر)', logoImage: '' },
        shamCash: { enabled: true, accountName: '', accountNumber: '', qrCode: '', displayName: 'شام كاش', logoImage: '' },
        siretelCash: { enabled: true, accountName: '', accountNumber: '', qrCode: '', displayName: 'سيريتل كاش', logoImage: '' },
        minDeposit: 3,
        supportWhatsApp: '963939454690',
      });
      setLoading(false);
    }
  }, [topUpSettings]);

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
    const success = await updateTopUpSettings(form);
    setSaving(false);
    if (success) {
      // يمكن إعادة تحميل البيانات أو تحديث الـ store
    }
  };

  if (loading) return <div className="admin-topup-loading">جاري تحميل الإعدادات...</div>;
  if (!form) return <div className="admin-topup-loading">لا يمكن تهيئة النموذج، يرجى تحديث الصفحة.</div>;

  return (
    <div className="admin-topup-settings" dir="rtl">
      <h2>⚙️ إعدادات شحن الرصيد</h2>
      <p className="admin-topup-settings__desc">قم بتفعيل طرق الدفع وإدخال بيانات الحسابات ورفع QR Codes وشعارات التطبيقات.</p>

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
          <Input label="اسم التطبيق الذي سيظهر للمستخدم" value={form.usdt.displayName} onChange={e => handleMethodChange('usdt', 'displayName', e.target.value)} />
          <div className="qr-upload">
            <label>شعار التطبيق (صورة)</label>
            <ImageUpload onUploadComplete={(url) => handleMethodChange('usdt', 'logoImage', url)} maxSizeMB={0.5} storagePath="topup/usdt" />
            {form.usdt.logoImage && <img src={form.usdt.logoImage} alt="شعار USDT" style={{ width: '60px' }} />}
          </div>
          <Input label="عنوان المحفظة (Address)" value={form.usdt.address} onChange={e => handleMethodChange('usdt', 'address', e.target.value)} placeholder="TXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" />
          <div className="form-field">
            <label>الشبكة</label>
            <select value={form.usdt.network} onChange={e => handleMethodChange('usdt', 'network', e.target.value)}>
              <option value="TRC20">TRC20 (Tron) - موصى به</option>
              <option value="BEP20">BEP20 (BSC)</option>
              <option value="ERC20">ERC20 (Ethereum)</option>
            </select>
          </div>
          <div className="qr-upload">
            <label>صورة QR Code (اختياري)</label>
            <ImageUpload onUploadComplete={(url) => handleMethodChange('usdt', 'qrCode', url)} maxSizeMB={0.5} storagePath="topup/usdt/qr" />
            {form.usdt.qrCode && <img src={form.usdt.qrCode} alt="QR" style={{ width: '80px' }} />}
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
          <Input label="اسم التطبيق الذي سيظهر للمستخدم" value={form.shamCash.displayName} onChange={e => handleMethodChange('shamCash', 'displayName', e.target.value)} />
          <div className="qr-upload">
            <label>شعار التطبيق (صورة)</label>
            <ImageUpload onUploadComplete={(url) => handleMethodChange('shamCash', 'logoImage', url)} maxSizeMB={0.5} storagePath="topup/shamCash" />
            {form.shamCash.logoImage && <img src={form.shamCash.logoImage} alt="شعار شام كاش" style={{ width: '60px' }} />}
          </div>
          <Input label="اسم المستفيد" value={form.shamCash.accountName} onChange={e => handleMethodChange('shamCash', 'accountName', e.target.value)} placeholder="الاسم الكامل للمستفيد" />
          <Input label="رقم الحساب / الهاتف" value={form.shamCash.accountNumber} onChange={e => handleMethodChange('shamCash', 'accountNumber', e.target.value)} placeholder="09XXXXXXXX" />
          <div className="qr-upload">
            <label>صورة QR Code (اختياري)</label>
            <ImageUpload onUploadComplete={(url) => handleMethodChange('shamCash', 'qrCode', url)} maxSizeMB={0.5} storagePath="topup/shamCash/qr" />
            {form.shamCash.qrCode && <img src={form.shamCash.qrCode} alt="QR" style={{ width: '80px' }} />}
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
          <Input label="اسم التطبيق الذي سيظهر للمستخدم" value={form.siretelCash.displayName} onChange={e => handleMethodChange('siretelCash', 'displayName', e.target.value)} />
          <div className="qr-upload">
            <label>شعار التطبيق (صورة)</label>
            <ImageUpload onUploadComplete={(url) => handleMethodChange('siretelCash', 'logoImage', url)} maxSizeMB={0.5} storagePath="topup/siretelCash" />
            {form.siretelCash.logoImage && <img src={form.siretelCash.logoImage} alt="شعار سيريتل كاش" style={{ width: '60px' }} />}
          </div>
          <Input label="اسم المستفيد" value={form.siretelCash.accountName} onChange={e => handleMethodChange('siretelCash', 'accountName', e.target.value)} placeholder="الاسم الكامل للمستفيد" />
          <Input label="رقم الحساب / الهاتف" value={form.siretelCash.accountNumber} onChange={e => handleMethodChange('siretelCash', 'accountNumber', e.target.value)} placeholder="09XXXXXXXX" />
          <div className="qr-upload">
            <label>صورة QR Code (اختياري)</label>
            <ImageUpload onUploadComplete={(url) => handleMethodChange('siretelCash', 'qrCode', url)} maxSizeMB={0.5} storagePath="topup/siretelCash/qr" />
            {form.siretelCash.qrCode && <img src={form.siretelCash.qrCode} alt="QR" style={{ width: '80px' }} />}
          </div>
        </div>
      </div>

      {/* General Settings */}
      <div className="general-settings">
        <h3>الإعدادات العامة</h3>
        <div className="general-row">
          <Input label="الحد الأدنى للإيداع (دولار أمريكي)" type="number" step="1" min="1" value={form.minDeposit} onChange={e => handleGeneralChange('minDeposit', parseInt(e.target.value) || 3)} />
          <Input label="رقم واتساب الدعم (بدون + أو مسافات)" value={form.supportWhatsApp} onChange={e => handleGeneralChange('supportWhatsApp', e.target.value.replace(/\D/g, ''))} placeholder="963939454690" />
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