import { useState, useEffect } from 'react';
import { usePaymentSettings } from '../../../context/PaymentSettingsContext';
import Input from '../../GeneralComponents/Input/Input';
import Button from '../../GeneralComponents/Button/Button';
import ImageUpload from '../../GeneralComponents/ImageUpload/ImageUpload';
import './AdminPaymentSettings.css';

export default function AdminPaymentSettings() {
  const { settings, updateSettings } = usePaymentSettings();
  const [form, setForm] = useState({
    qrImageBase64: '',
    accountNumber: '',
    accountName: '',
    bankName: '',
    link: '',
  });
  const [saving, setSaving] = useState(false);

  // مزامنة النموذج مع الإعدادات عند تحميلها
  useEffect(() => {
    if (settings) {
      setForm({
        qrImageBase64: settings.qrImageBase64 || '',
        accountNumber: settings.accountNumber || '',
        accountName: settings.accountName || '',
        bankName: settings.bankName || '',
        link: settings.link || '',
      });
    }
  }, [settings]);

  const handleImageComplete = (base64) => {
    setForm(prev => ({ ...prev, qrImageBase64: base64 }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings(form);
    } finally {
      setSaving(false);
    }
  };

  if (!settings) return <div>جاري التحميل...</div>;

  return (
    <div className="admin-payment-settings">
      <h2>💳 إعدادات معلومات الدفع</h2>
      <form onSubmit={handleSubmit} className="payment-form">
        <div className="form-group">
          <label>صورة رمز الاستجابة السريعة (QR)</label>
          <ImageUpload
            label="اختر صورة QR"
            onUploadComplete={handleImageComplete}
            maxSizeMB={0.5}
            disabled={saving}
          />
          {form.qrImageBase64 && (
            <div className="qr-preview">
              <img src={form.qrImageBase64} alt="QR Preview" />
            </div>
          )}
        </div>

        <Input
          label="رقم الحساب / الآيبان"
          value={form.accountNumber}
          onChange={e => setForm({ ...form, accountNumber: e.target.value })}
          placeholder="SA00 0000 0000 0000 0000"
        />
        <Input
          label="اسم الحساب (المستفيد)"
          value={form.accountName}
          onChange={e => setForm({ ...form, accountName: e.target.value })}
          placeholder="اسم صاحب الحساب"
        />
        <Input
          label="اسم البنك"
          value={form.bankName}
          onChange={e => setForm({ ...form, bankName: e.target.value })}
          placeholder="البنك"
        />
        <Input
          label="رابط تحويل إضافي (اختياري)"
          value={form.link}
          onChange={e => setForm({ ...form, link: e.target.value })}
          placeholder="https://example.com/pay"
        />

        <Button type="submit" disabled={saving}>
          {saving ? 'جاري الحفظ...' : '💾 حفظ التغييرات'}
        </Button>
      </form>
    </div>
  );
}