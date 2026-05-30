import { useState } from 'react';
import { useStoreSettings } from '../../../context/StoreSettingsContext';
import ImageUpload from '../../GeneralComponents/ImageUpload/ImageUpload';
import Button from '../../GeneralComponents/Button/Button';
import './AdminStoreSettings.css';

export default function AdminStoreSettings() {
  const { settings, updateSettings } = useStoreSettings();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState('');

  const handleImageComplete = (base64) => {
    setPreview(base64);
  };

  const handleSave = async () => {
    if (!preview) return;
    setUploading(true);
    await updateSettings({ backgroundImageBase64: preview });
    setUploading(false);
    setPreview('');
  };

  const handleRemove = async () => {
    if (window.confirm('هل تريد إزالة الصورة؟')) {
      setUploading(true);
      await updateSettings({ backgroundImageBase64: '' });
      setUploading(false);
    }
  };

  if (!settings) return <div>جاري التحميل...</div>;

  return (
    <div className="admin-store-settings">
      <h2>🎨 إعدادات خلفية صفحة الترحيب</h2>
      <div className="current-background">
        <p>الخلفية الحالية:</p>
        {settings.backgroundImageBase64 ? (
          <img src={settings.backgroundImageBase64} alt="الخلفية" />
        ) : (
          <div className="no-image">لا توجد خلفية مخصصة (سيظهر لون افتراضي)</div>
        )}
      </div>
      <div className="upload-section">
        <ImageUpload
          label="رفع صورة جديدة للخلفية (يفضل عرض واسع، حجم معقول)"
          onUploadComplete={handleImageComplete}
          maxSizeMB={0.8}
          disabled={uploading}
        />
        {preview && (
          <div className="preview">
            <p>معاينة الصورة الجديدة:</p>
            <img src={preview} alt="معاينة" />
          </div>
        )}
      </div>
      <div className="actions">
        <Button onClick={handleSave} disabled={uploading || !preview}>
          {uploading ? 'جاري الحفظ...' : 'حفظ الصورة كخلفية'}
        </Button>
        {settings.backgroundImageBase64 && (
          <Button variant="danger" onClick={handleRemove} disabled={uploading}>
            إزالة الخلفية
          </Button>
        )}
      </div>
    </div>
  );
}