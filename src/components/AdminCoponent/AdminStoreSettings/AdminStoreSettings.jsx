import { useState } from 'react';
import { useStoreSettings } from '../../../context/StoreSettingsContext';
import ImageUpload from '../../GeneralComponents/ImageUpload/ImageUpload';
import Button from '../../GeneralComponents/Button/Button';
import './AdminStoreSettings.css';

export default function AdminStoreSettings() {
  const { settings, updateSettings } = useStoreSettings();
  const [uploading, setUploading] = useState(false);
  
  // حالة رفع صورة الخلفية (القسم القديم)
  const [backgroundPreview, setBackgroundPreview] = useState('');
  
  // حالة رفع صورة الهاتف (القسم الجديد)
  const [phonePreview, setPhonePreview] = useState('');
  const [uploadingPhone, setUploadingPhone] = useState(false);

  // دالة حفظ صورة الخلفية
  const handleBackgroundImageComplete = (base64) => {
    setBackgroundPreview(base64);
  };

  const handleSaveBackground = async () => {
    if (!backgroundPreview) return;
    setUploading(true);
    await updateSettings({ backgroundImageBase64: backgroundPreview });
    setUploading(false);
    setBackgroundPreview('');
  };

  const handleRemoveBackground = async () => {
    if (window.confirm('هل تريد إزالة خلفية صفحة الترحيب؟')) {
      setUploading(true);
      await updateSettings({ backgroundImageBase64: '' });
      setUploading(false);
    }
  };

  // دالة حفظ صورة الهاتف
  const handlePhoneImageComplete = (base64) => {
    setPhonePreview(base64);
  };

  const handleSavePhoneImage = async () => {
    if (!phonePreview) return;
    setUploadingPhone(true);
    await updateSettings({ loginPhoneImage: phonePreview });
    setUploadingPhone(false);
    setPhonePreview('');
  };

  const handleRemovePhoneImage = async () => {
    if (window.confirm('هل تريد إزالة صورة الهاتف من صفحة تسجيل الدخول؟')) {
      setUploadingPhone(true);
      await updateSettings({ loginPhoneImage: '' });
      setUploadingPhone(false);
    }
  };

  if (!settings) return <div>جاري التحميل...</div>;

  return (
    <div className="admin-store-settings">
      {/* ========== القسم الأول: خلفية صفحة الترحيب (القديم) ========== */}
      <div className="settings-section">
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
            onUploadComplete={handleBackgroundImageComplete}
            maxSizeMB={0.8}
            disabled={uploading || uploadingPhone}
          />
          {backgroundPreview && (
            <div className="preview">
              <p>معاينة الصورة الجديدة:</p>
              <img src={backgroundPreview} alt="معاينة" />
            </div>
          )}
        </div>
        <div className="actions">
          <Button onClick={handleSaveBackground} disabled={uploading || !backgroundPreview}>
            {uploading ? 'جاري الحفظ...' : 'حفظ الصورة كخلفية'}
          </Button>
          {settings.backgroundImageBase64 && (
            <Button variant="danger" onClick={handleRemoveBackground} disabled={uploading}>
              إزالة الخلفية
            </Button>
          )}
        </div>
      </div>

      {/* ========== القسم الثاني: صورة الهاتف لصفحة تسجيل الدخول (الجديد) ========== */}
      <div className="settings-section">
        <h2>📱 صورة الهاتف (صفحة تسجيل الدخول)</h2>
        <p className="section-desc">تظهر هذه الصورة في العمود الأيسر على الشاشات الكبيرة (مثل إنستغرام)</p>
        
        <div className="current-background">
          <p>الصورة الحالية:</p>
          {settings.loginPhoneImage ? (
            <img src={settings.loginPhoneImage} alt="صورة الهاتف" style={{ maxWidth: '200px', border: '1px solid #ddd', borderRadius: '12px' }} />
          ) : (
            <div className="no-image">لا توجد صورة مخصصة (سيظهر إطار فارغ أو نص افتراضي)</div>
          )}
        </div>

        <div className="upload-section">
          <ImageUpload
            label="رفع صورة الهاتف (يفضل نسبة 9:16، مثل 360×640 بكسل)"
            onUploadComplete={handlePhoneImageComplete}
            maxSizeMB={0.5}
            disabled={uploading || uploadingPhone}
          />
          {phonePreview && (
            <div className="preview">
              <p>معاينة الصورة الجديدة:</p>
              <img src={phonePreview} alt="معاينة الهاتف" style={{ maxWidth: '200px', border: '1px solid #ddd', borderRadius: '12px' }} />
            </div>
          )}
        </div>

        <div className="actions">
          <Button onClick={handleSavePhoneImage} disabled={uploadingPhone || !phonePreview}>
            {uploadingPhone ? 'جاري الحفظ...' : 'حفظ صورة الهاتف'}
          </Button>
          {settings.loginPhoneImage && (
            <Button variant="danger" onClick={handleRemovePhoneImage} disabled={uploadingPhone}>
              إزالة الصورة
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}