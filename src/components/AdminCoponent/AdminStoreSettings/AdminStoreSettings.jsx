import { useState, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAppStore } from '../../../store/store';
import ImageUpload from '../../GeneralComponents/ImageUpload/ImageUpload';
import Button from '../../GeneralComponents/Button/Button';
import toast from 'react-hot-toast';
import './AdminStoreSettings.css';

export default function AdminStoreSettings() {
  // ✅ استخدم useAppStore بدلاً من useStoreSettings
  const storeSettings = useAppStore((state) => state.storeSettings);
  const setStoreSettings = useAppStore((state) => state.setStoreSettings);

  const [uploading, setUploading] = useState(false);
  const [backgroundPreview, setBackgroundPreview] = useState('');
  const [phonePreview, setPhonePreview] = useState('');
  const [uploadingPhone, setUploadingPhone] = useState(false);

  // ===== دالة حفظ بيانات المتجر في Firestore =====
  const updateSettingsInFirestore = async (data) => {
    try {
      const docRef = doc(db, 'storeSettings', 'default');
      await setDoc(docRef, data, { merge: true });
      // تحديث الـ store المحلي
      const updatedSettings = { ...storeSettings, ...data };
      setStoreSettings(updatedSettings);
      toast.success('تم حفظ الإعدادات بنجاح');
      return true;
    } catch (err) {
      console.error(err);
      toast.error('فشل حفظ الإعدادات');
      return false;
    }
  };

  // ===== صورة الخلفية =====
  const handleBackgroundImageComplete = (url) => {
    setBackgroundPreview(url);
  };

  const handleSaveBackground = async () => {
    if (!backgroundPreview) return;
    setUploading(true);
    await updateSettingsInFirestore({ backgroundImageUrl: backgroundPreview });
    setUploading(false);
    setBackgroundPreview('');
  };

  const handleRemoveBackground = async () => {
    if (window.confirm('هل تريد إزالة خلفية صفحة الترحيب؟')) {
      setUploading(true);
      await updateSettingsInFirestore({ backgroundImageUrl: '' });
      setUploading(false);
    }
  };

  // ===== صورة الهاتف =====
  const handlePhoneImageComplete = (url) => {
    setPhonePreview(url);
  };

  const handleSavePhoneImage = async () => {
    if (!phonePreview) return;
    setUploadingPhone(true);
    await updateSettingsInFirestore({ loginPhoneImageUrl: phonePreview });
    setUploadingPhone(false);
    setPhonePreview('');
  };

  const handleRemovePhoneImage = async () => {
    if (window.confirm('هل تريد إزالة صورة الهاتف من صفحة تسجيل الدخول؟')) {
      setUploadingPhone(true);
      await updateSettingsInFirestore({ loginPhoneImageUrl: '' });
      setUploadingPhone(false);
    }
  };

  if (!storeSettings) return <div>جاري التحميل...</div>;

  return (
    <div className="admin-store-settings">
      {/* ========== القسم الأول: خلفية صفحة الترحيب ========== */}
      <div className="settings-section">
        <h2>🎨 إعدادات خلفية صفحة الترحيب</h2>
        <div className="current-background">
          <p>الخلفية الحالية:</p>
          {storeSettings.backgroundImageUrl ? (
            <img src={storeSettings.backgroundImageUrl} alt="الخلفية" />
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
            storagePath="store/background"
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
          {storeSettings.backgroundImageUrl && (
            <Button variant="danger" onClick={handleRemoveBackground} disabled={uploading}>
              إزالة الخلفية
            </Button>
          )}
        </div>
      </div>

      {/* ========== القسم الثاني: صورة الهاتف لصفحة تسجيل الدخول ========== */}
      <div className="settings-section">
        <h2>📱 صورة الهاتف (صفحة تسجيل الدخول)</h2>
        <p className="section-desc">تظهر هذه الصورة في العمود الأيسر على الشاشات الكبيرة (مثل إنستغرام)</p>
        
        <div className="current-background">
          <p>الصورة الحالية:</p>
          {storeSettings.loginPhoneImageUrl ? (
            <img src={storeSettings.loginPhoneImageUrl} alt="صورة الهاتف" style={{ maxWidth: '200px', border: '1px solid #ddd', borderRadius: '12px' }} />
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
            storagePath="store/phone"
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
          {storeSettings.loginPhoneImageUrl && (
            <Button variant="danger" onClick={handleRemovePhoneImage} disabled={uploadingPhone}>
              إزالة الصورة
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}