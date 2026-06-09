import { useState, useEffect, useRef } from 'react';
import imageCompression from 'browser-image-compression';
import { uploadImage } from '../../../utils/uploadImage';
import './ImageUpload.css';

export default function ImageUpload({
  label = 'رفع صورة',
  maxSizeMB = 0.3,        // تم تخفيض الحجم إلى 0.3 ميجابايت لتحسين الأداء
  maxWidthOrHeight = 800, // تم تخفيض الأبعاد القصوى لتقليل حجم الصورة
  onUploadComplete,
  disabled = false,
  storagePath = 'temp',
  convertToWebP = true,   // إضافة خيار التحويل إلى WebP (افتراضي true)
}) {
  const [compressing, setCompressing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState('');
  const previewUrlRef = useRef(null); // لتخزين URL المعاينة وتحريرها

  // تنظيف URL المعاينة عند إلغاء التحميل أو تغيير الملف
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // تنظيف المعاينة السابقة
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    setError('');
    setFileName('');
    setPreview('');
    setUploading(false);
    setCompressing(false);

    if (!file.type.startsWith('image/')) {
      setError('الملف المختار ليس صورة');
      return;
    }

    try {
      setCompressing(true);

      // إعدادات الضغط – تحويل إلى WebP إذا كان مفعلاً
      const options = {
        maxSizeMB,
        maxWidthOrHeight,
        useWebWorker: true,
        fileType: convertToWebP ? 'image/webp' : file.type,
        // جودة 0.8 للحصول على حجم أقل مع الحفاظ على جودة مقبولة
        initialQuality: 0.8,
      };
      const compressedFile = await imageCompression(file, options);
      
      // توليد اسم ملف مناسب (مع امتداد webp إذا كان التحويل مفعلاً)
      const fileExtension = convertToWebP ? 'webp' : file.name.split('.').pop();
      const finalFileName = `${compressedFile.name.split('.')[0]}.${fileExtension}`;
      setFileName(finalFileName);

      // معاينة الصورة (يتم إنشاء URL مؤقت)
      const previewUrl = URL.createObjectURL(compressedFile);
      previewUrlRef.current = previewUrl;
      setPreview(previewUrl);

      // رفع الصورة إلى Firebase Storage
      setUploading(true);
      setCompressing(false);

      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const path = `${storagePath}/${uniqueSuffix}_${finalFileName}`;
      const url = await uploadImage(compressedFile, path);
      
      onUploadComplete?.(url);
    } catch (err) {
      console.error('خطأ في معالجة الصورة:', err);
      setError('حدث خطأ أثناء معالجة الصورة أو رفعها: ' + (err.message || ''));
    } finally {
      setCompressing(false);
      setUploading(false);
    }
  };

  return (
    <div className="image-upload">
      <label className="image-upload__label">{label}</label>
      <div className={`image-upload__input-wrapper ${disabled ? 'disabled' : ''}`}>
        <input
          type="file"
          accept={convertToWebP ? "image/*" : "image/jpeg,image/png,image/webp"}
          onChange={handleFileChange}
          disabled={disabled || compressing || uploading}
        />
        {compressing && <span className="image-upload__status">جاري ضغط الصورة وتحسينها...</span>}
        {uploading && <span className="image-upload__status">جاري رفع الصورة...</span>}
        {preview && !compressing && !uploading && (
          <div className="preview">
            <img src={preview} alt="معاينة" loading="lazy" />
          </div>
        )}
        {fileName && !compressing && !uploading && !error && (
          <span className="image-upload__file-name">{fileName}</span>
        )}
        {error && <span className="image-upload__error">{error}</span>}
      </div>
      <small className="image-upload__hint">
        أقصى حجم بعد الضغط: {maxSizeMB} ميجابايت (يتم التحويل إلى WebP للحصول على جودة عالية بحجم أقل)
      </small>
    </div>
  );
}